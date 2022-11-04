import { useEffect, useRef, useState } from 'react';
import { useNavigate, useResolvedPath } from 'react-router-dom';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';
import { DateTime } from 'luxon';
import classNames from 'classnames';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';

import './Photo.scss';
import InteractivePhoto from './InteractivePhoto';
import PhotoForm from './PhotoForm';
import PhotoPanel from './PhotoPanel';

function Photo({ id, page, sort, nextId, prevId, onDeleted, timerDuration }) {
  const { user } = useAuthContext();
  const fshandle = useFullScreenHandle();
  const { pathname } = useResolvedPath('');
  const navigate = useNavigate();
  const ref = useRef();

  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [isEditing, setEditing] = useState(false);
  const [countdown, setCountdown] = useState();

  let baseUrl = pathname;
  const listUrl = `${baseUrl}${!page || page === 1 ? '' : `?page=${page}`}${!sort || sort === 'createdAt' ? '' : `?sort=${sort}`}`;

  useEffect(() => {
    setLoading(true);
    Api.photos.get(id).then((response) => setData(response.data));
    setTimeout(() => ref.current?.focus(), 0);
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

  function onLoad() {
    setLoading(false);
  }

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

  return (
    <div className="photo" ref={ref} tabIndex={0} onKeyDown={onKeyDown}>
      {data && (
        <>
          <div className="mb-4">
            <FullScreen className="photo__fullscreen" handle={fshandle}>
              {!fshandle.active && <img src={data.largeUrl} alt={data.caption} onLoad={onLoad} className="photo__image" />}
              {fshandle.active && (
                <>
                  <InteractivePhoto
                    prevId={prevId}
                    listUrl={listUrl}
                    nextId={nextId}
                    onChangeRating={onChangeRating}
                    data={data}
                    onKeyDown={onKeyDown}
                    onLoad={onLoad}
                  />
                  {countdown && (
                    <div className={classNames('photo__countdown', { 'photo__countdown--expired': countdown.startsWith('-') })}>
                      {countdown}
                    </div>
                  )}
                </>
              )}
              <div className={classNames('photo__loader', { 'd-none': !isLoading, 'photo__loader--fullscreen': fshandle.active })}>
                <h1>Loading...</h1>
              </div>
            </FullScreen>
          </div>
          <div className="row justify-content-center">
            <div className="col-xl-8">
              {!isEditing && (
                <PhotoPanel
                  isFullScreen={false}
                  prevId={prevId}
                  listUrl={listUrl}
                  nextId={nextId}
                  data={data}
                  onChangeRating={onChangeRating}
                  onEdit={onEdit}
                  onFullScreen={fshandle.enter}
                />
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
