import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useResolvedPath } from 'react-router-dom';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { DateTime } from 'luxon';
import inflection from 'inflection';
import classNames from 'classnames';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import License from '../Components/License';

import './Photo.scss';
import InteractivePhoto from './InteractivePhoto';
import PhotoFeature from './PhotoFeature';
import PhotoForm from './PhotoForm';
import PhotoRating from './PhotoRating';

function Photo({ id, page, sort, nextId, prevId, onDeleted, timerDuration }) {
  const { user } = useAuthContext();
  const fshandle = useFullScreenHandle();
  const { pathname } = useResolvedPath('');
  const navigate = useNavigate();
  const ref = useRef();

  const [data, setData] = useState(null);
  const [isEditing, setEditing] = useState(false);
  const [countdown, setCountdown] = useState();

  let baseUrl = pathname;
  const listUrl = `${baseUrl}${!page || page === 1 ? '' : `?page=${page}`}${!sort || sort === 'createdAt' ? '' : `?sort=${sort}`}`;

  useEffect(() => {
    Api.photos.get(id).then((response) => setData(response.data));
    ref.current?.focus();
    if (timerDuration) {
      const startTime = DateTime.now().plus({ seconds: 2 });
      const interval = setInterval(() => {
        let { seconds } = DateTime.now().diff(startTime, ['seconds']);
        seconds = Math.max(0, seconds);
        let prefix = '';
        seconds = timerDuration - seconds;
        if (seconds < 0) {
          seconds = -seconds;
          prefix = '-';
        }
        setCountdown(`${prefix}${Math.floor(seconds / 60)}:${`${Math.floor(seconds % 60)}`.padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown();
    }
  }, [id, timerDuration]);

  function onEdit() {
    setEditing(true);
  }

  function onCancel() {
    setEditing(false);
  }

  function onChangeRating(newValue) {
    const newData = { ...data };
    // add/update rating to list
    let rating = newData.Ratings.find((r) => r.UserId === user?.id);
    if (rating) {
      rating.value = newValue;
    } else {
      rating = {
        UserId: user?.id,
        value: newValue,
      };
      newData.Ratings.push(rating);
    }
    // locally recalculate average
    const ratings = newData.Ratings.filter((r) => r.UserId !== data.UserId);
    newData.rating = ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length;
    setData(newData);
    Api.photos.rate(id, newValue);
  }

  function onUpdated(newData) {
    setData(newData);
    setEditing(false);
  }

  function onDeletedInternal() {
    if (onDeleted) {
      onDeleted(id);
    }
    navigate(listUrl, { replace: true });
  }

  function onKeyDown(event) {
    if (isEditing) {
      return;
    }
    switch (event.keyCode) {
      case 37:
        if (prevId) {
          navigate(prevId);
        }
        break;
      case 39:
        if (nextId) {
          navigate(nextId);
        }
        break;
      default:
        break;
    }
  }

  const ratings = [0, 0, 0, 0, 0];
  let rating;
  if (data) {
    data.Ratings.forEach((r) => {
      ratings[5 - r.value] += r.UserId !== data.UserId ? 1 : 0;
      if (r.UserId === user?.id) {
        rating = r;
      }
    });
  }
  const popover = (
    <Popover id="popover-basic">
      <Popover.Header as="h3" className="text-center">
        Ratings
      </Popover.Header>
      <Popover.Body>
        <table className="table table-sm table-borderless m-0">
          <tbody>
            {ratings.map((r, index) => (
              <tr key={index}>
                <td>{r}</td>
                <td className="text-nowrap">
                  {[...Array(5 - index)].map((_, i) => (
                    <FontAwesomeIcon key={`${index}-${i}`} icon={faStarSolid} />
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Popover.Body>
    </Popover>
  );

  let cameraModel = null;
  if (data?.metadata?.exif?.Make || data?.metadata?.exif?.Model) {
    const make = inflection.capitalize(data.metadata?.exif?.Make?.description ?? '');
    let model = data.metadata?.exif?.Model?.description ?? '';
    if (model.startsWith(`${make} `)) {
      model = model.substring(make.length + 1);
    }
    cameraModel = `${make} ${model}`.trim();
  }

  return (
    <div className="photo" ref={ref} tabIndex={0} onKeyDown={onKeyDown}>
      {data && (
        <>
          <div className="mb-4">
            <FullScreen handle={fshandle}>
              {!fshandle.active && <img src={data.largeUrl} alt={data.caption} className="photo__image" />}
              {fshandle.active && (
                <>
                  <InteractivePhoto id={data.id} alt={data.caption} url={data.largeUrl} onKeyDown={onKeyDown} />
                  {countdown && (
                    <div className={classNames('photo__countdown', { 'photo__countdown--expired': countdown.startsWith('-') })}>
                      {countdown}
                    </div>
                  )}
                </>
              )}
            </FullScreen>
          </div>
          <div className="row justify-content-center">
            <div className="col-xl-8">
              {!isEditing && (
                <>
                  <div className="row mb-3">
                    <div className="col-4">
                      {prevId && (
                        <Link to={prevId} className="btn btn-link p-0 text-secondary">
                          &lArr; Prev
                        </Link>
                      )}
                    </div>
                    <div className="col-4 text-center">
                      {listUrl !== '/' && (
                        <Link to={listUrl} className="btn btn-link p-0 text-secondary">
                          Back to List
                        </Link>
                      )}
                    </div>
                    <div className="col-4 text-end">
                      {nextId && (
                        <Link to={nextId} className="btn btn-link p-0 text-secondary">
                          Next &rArr;
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-8">
                      {(data.caption || data.description) && (
                        <dl>
                          <dt>{data.caption}</dt>
                          <dd>{data.description}</dd>
                        </dl>
                      )}
                      <div className="row">
                        <div className="col-6">
                          <dl className="small">
                            <dt>Taken by:</dt>
                            <dd>
                              <Link to={`/members/${data.User.username}`}>
                                {data.User?.firstName} {data.User?.lastName}
                              </Link>
                            </dd>
                            {user && data.takenAt && (
                              <>
                                <dt>Taken on:</dt>
                                <dd>{DateTime.fromISO(data.takenAt).toLocaleString(DateTime.DATETIME_MED)}</dd>
                              </>
                            )}
                            <dt>License:</dt>
                            <dd>
                              <License selected={data.license} />
                            </dd>
                          </dl>
                        </div>
                        <div className="col-6">
                          {user && (
                            <dl className="small">
                              {cameraModel && (
                                <>
                                  <dt>Camera model:</dt>
                                  <dd>{cameraModel}</dd>
                                </>
                              )}
                              {data.metadata?.exif?.LensModel && (
                                <>
                                  <dt>Lens model:</dt>
                                  <dd>{data.metadata.exif.LensModel.description}</dd>
                                </>
                              )}
                              {(data.metadata?.exif?.FNumber || data.metadata?.exif?.ISOSpeedRatings) && (
                                <div className="d-flex">
                                  {data.metadata?.exif?.FNumber && (
                                    <div className="flex-fill">
                                      <dt>F-stop:</dt>
                                      <dd>{data.metadata.exif.FNumber.description}</dd>
                                    </div>
                                  )}
                                  {data.metadata?.exif?.ShutterSpeedValue && (
                                    <div className="flex-fill">
                                      <dt>Shutter:</dt>
                                      <dd>{data.metadata.exif.ShutterSpeedValue.description}</dd>
                                    </div>
                                  )}
                                  {data.metadata?.exif?.ISOSpeedRatings && (
                                    <div className="flex-fill">
                                      <dt>ISO:</dt>
                                      <dd>{data.metadata.exif.ISOSpeedRatings.description}</dd>
                                    </div>
                                  )}
                                </div>
                              )}
                            </dl>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 offset-md-1">
                      <dl className="small">
                        <dd className="d-flex gap-2 mb-3">
                          {listUrl !== '/' && (
                            <button onClick={fshandle.enter} className="btn btn-sm btn-outline-secondary">
                              Full Screen
                            </button>
                          )}
                          {data.User?.id === user?.id && (
                            <button onClick={onEdit} type="button" className="btn btn-sm btn-outline-secondary">
                              Edit
                            </button>
                          )}
                        </dd>
                        {user && (
                          <>
                            <div className="d-flex">
                              <div className="flex-fill">
                                <dt>Avg. rating:</dt>
                                <dd>
                                  <OverlayTrigger trigger="click" placement="top" overlay={popover}>
                                    <button type="button" className="btn btn-sm btn-link p-0">
                                      <FontAwesomeIcon icon={faStarSolid} /> {data.rating.toFixed(1)}
                                    </button>
                                  </OverlayTrigger>
                                </dd>
                              </div>
                              <div className="flex-fill">
                                <dt>Your rating:</dt>
                                <dd>
                                  <PhotoRating onChange={onChangeRating} value={rating?.value} />
                                </dd>
                              </div>
                            </div>
                          </>
                        )}
                        {user && user.id === data.UserId && (
                          <>
                            <dt>Public visibility:</dt>
                            <dd>
                              <PhotoFeature photo={data} />
                            </dd>
                          </>
                        )}
                      </dl>
                    </div>
                  </div>
                </>
              )}
              {isEditing && <PhotoForm id={id} onCancel={onCancel} onUpdated={onUpdated} onDeleted={onDeletedInternal} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default Photo;
