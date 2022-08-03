import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useResolvedPath } from 'react-router-dom';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import License from '../Components/License';

import './Photo.scss';
import InteractivePhoto from './InteractivePhoto';
import PhotoForm from './PhotoForm';
import PhotoRating from './PhotoRating';

function Photo({ id, page, nextId, prevId, onDeleted }) {
  const { user } = useAuthContext();
  const fshandle = useFullScreenHandle();
  const { pathname } = useResolvedPath('');
  const navigate = useNavigate();
  const ref = useRef();

  const [data, setData] = useState(null);
  const [isEditing, setEditing] = useState(false);

  let baseUrl = pathname;
  const listUrl = `${baseUrl}${!page || page === 1 ? '' : `?page=${page}`}`;

  useEffect(() => {
    Api.photos.get(id).then((response) => setData(response.data));
    ref.current?.focus();
  }, [id]);

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
    newData.rating = newData.Ratings.reduce((sum, rating) => sum + rating.value, 0) / newData.Ratings.length;
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

  const ratings = [0, 0, 0];
  let rating;
  if (data) {
    data.Ratings.forEach((r) => {
      ratings[3 - r.value] += 1;
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
                  {[...Array(3 - index)].map((_, i) => (
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

  return (
    <div className="photo" ref={ref} tabIndex={0} onKeyDown={onKeyDown}>
      {data && (
        <>
          <div className="mb-4">
            <FullScreen handle={fshandle}>
              {!fshandle.active && <img src={data.largeUrl} alt={data.caption} className="photo__image" />}
              {fshandle.active && <InteractivePhoto id={data.id} alt={data.caption} url={data.largeUrl} onKeyDown={onKeyDown} />}
            </FullScreen>
          </div>
          <div className="row justify-content-center">
            <div className="col-xl-8">
              {!isEditing && (
                <>
                  <div className="row">
                    <div className="col-md-8">
                      <dl>
                        <dt>{data.caption}</dt>
                        <dd>{data.description}</dd>
                        <dt>Taken by:</dt>
                        <dd>
                          <Link to={`/members/${data.User.username}`}>
                            {data.User?.firstName} {data.User?.lastName}
                          </Link>
                        </dd>
                        <dt>License:</dt>
                        <dd>
                          <License selected={data.license} />
                        </dd>
                      </dl>
                    </div>
                    <div className="col-md-3 offset-md-1">
                      <dl className="small">
                        {user && user.id !== data.UserId && (
                          <>
                            <dt>Your rating:</dt>
                            <dd>
                              <PhotoRating onChange={onChangeRating} value={rating?.value} />
                            </dd>
                          </>
                        )}
                        <dt>Avg. rating:</dt>
                        <dd>
                          <OverlayTrigger trigger="click" placement="top" overlay={popover}>
                            <button type="button" className="btn btn-sm btn-link p-0">
                              <FontAwesomeIcon icon={faStarSolid} /> {data.rating.toFixed(1)}
                            </button>
                          </OverlayTrigger>
                        </dd>
                        <dd className="mt-3 d-flex gap-2">
                          <button onClick={fshandle.enter} className="btn btn-sm btn-outline-secondary">
                            View Full Screen
                          </button>
                          {data.User?.id === user?.id && (
                            <button onClick={onEdit} type="button" className="btn btn-sm btn-outline-secondary">
                              Edit
                            </button>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-4">
                      {prevId && (
                        <Link to={prevId} className="btn btn-link p-0 text-secondary">
                          &lArr; Prev
                        </Link>
                      )}
                    </div>
                    <div className="col-4 text-center">
                      <Link to={listUrl} className="btn btn-link p-0 text-secondary">
                        Back to List
                      </Link>
                    </div>
                    <div className="col-4 text-end">
                      {nextId && (
                        <Link to={nextId} className="btn btn-link p-0 text-secondary">
                          Next &rArr;
                        </Link>
                      )}
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
