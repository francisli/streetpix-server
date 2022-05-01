import { useEffect, useRef, useState } from 'react';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import License from '../Components/License';

import './Photo.scss';
import InteractivePhoto from './InteractivePhoto';
import PhotoForm from './PhotoForm';

function Photo({ meetingId, userId, id, page, nextId, prevId, onDeleted }) {
  const { user } = useAuthContext();
  const { path } = useRouteMatch();
  const fshandle = useFullScreenHandle();
  const history = useHistory();
  const ref = useRef();

  const [data, setData] = useState(null);
  const [isEditing, setEditing] = useState(false);

  let baseUrl = path;
  if (userId) {
    baseUrl = baseUrl.replace(':userId', userId);
  } else if (meetingId) {
    baseUrl = baseUrl.replace(':meetingId', meetingId);
  }
  const listUrl = `${baseUrl.replace('/:photoId?', '')}${!page || page === 1 ? '' : `?page=${page}`}`;

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

  function onUpdated(newData) {
    setData(newData);
    setEditing(false);
  }

  function onDeletedInternal() {
    if (onDeleted) {
      onDeleted(id);
    }
    history.replace(listUrl);
  }

  function onKeyDown(event) {
    switch (event.keyCode) {
      case 37:
        if (prevId) {
          history.push(baseUrl.replace(':photoId?', prevId));
        }
        break;
      case 39:
        if (nextId) {
          history.push(baseUrl.replace(':photoId?', nextId));
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
          <div className="mb-3">
            <FullScreen handle={fshandle}>
              {!fshandle.active && <img src={data.largeUrl} alt={data.caption} className="photo__image" />}
              {fshandle.active && <InteractivePhoto id={data.id} alt={data.caption} url={data.largeUrl} onKeyDown={onKeyDown} />}
            </FullScreen>
          </div>
          <div className="row justify-content-center">
            <div className="col-md-3 text-end">
              {prevId && (
                <Link to={baseUrl.replace(':photoId?', prevId)} className="btn btn-sm btn-outline-secondary">
                  &lArr; Prev
                </Link>
              )}
            </div>
            <div className="col-md-6 pt-1">
              {!isEditing && (
                <>
                  <div className="photo__caption">{data.caption}</div>
                  <div className="photo__description">{data.description}</div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="photo__user text-secondary">
                        Taken by:{' '}
                        <Link to={`/members/${data.User.username}`}>
                          {data.User?.firstName} {data.User?.lastName}
                        </Link>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="photo__license text-secondary">
                        License: <License selected={data.license} />
                      </div>
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-4">
                      {data.User?.id === user?.id && (
                        <button onClick={onEdit} type="button" className="btn btn-sm btn-outline-secondary">
                          Edit
                        </button>
                      )}
                    </div>
                    <div className="col-4 text-center">
                      <Link to={listUrl} className="btn btn-sm btn-outline-secondary">
                        Back to List
                      </Link>
                    </div>
                    <div className="col-4 text-end">
                      <button onClick={fshandle.enter} className="btn btn-sm btn-outline-secondary">
                        View Full Screen
                      </button>
                    </div>
                  </div>
                </>
              )}
              {isEditing && <PhotoForm id={id} onCancel={onCancel} onUpdated={onUpdated} onDeleted={onDeletedInternal} />}
            </div>
            <div className="col-md-3">
              {nextId && (
                <Link to={baseUrl.replace(':photoId?', nextId)} className="btn btn-sm btn-outline-secondary">
                  Next &rArr;
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default Photo;
