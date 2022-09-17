import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ReactSortable } from 'react-sortablejs';
import classNames from 'classnames';
import { DateTime } from 'luxon';

import { useAuthContext } from '../AuthContext';
import Api from '../Api';
import Pagination from '../Components/Pagination';
import Photo from '../Photos/Photo';

import './User.scss';
import UserPhoto from './UserPhoto';

function User() {
  const auth = useAuthContext();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isDragging, setDragging] = useState(false);

  const { search } = useLocation();
  const [page, setPage] = useState(null);
  const [lastPage, setLastPage] = useState(null);

  const { userId, filter, photoId } = useParams();
  const [nextPhotoId, setNextPhotoId] = useState();
  const [prevPhotoId, setPrevPhotoId] = useState();

  const validPhotoId = photoId !== 'edit' ? photoId : undefined;

  useEffect(() => {
    if (userId) {
      Api.users.get(userId).then((response) => setUser(response.data));
    }
  }, [userId]);

  useEffect(() => {
    if (!validPhotoId || !page) {
      const params = new URLSearchParams(search);
      const newPage = parseInt(params.get('page') ?? '1', 10);
      if (newPage !== page) {
        setPage(newPage);
      }
    }
  }, [validPhotoId, search, page]);

  useEffect(() => {
    if (userId && page) {
      Api.photos.index(userId, filter, page).then((response) => {
        setPhotos(response.data);
        const linkHeader = Api.parseLinkHeader(response);
        let newLastPage = page;
        if (linkHeader?.last) {
          const match = linkHeader.last.match(/page=(\d+)/);
          newLastPage = parseInt(match[1], 10);
        } else if (linkHeader?.next) {
          newLastPage = page + 1;
        }
        setLastPage(newLastPage);
      });
    }
  }, [userId, filter, page]);

  useEffect(() => {
    if (userId && validPhotoId && photos && page && lastPage) {
      const index = photos.findIndex((photo) => photo.id === validPhotoId);
      if (index < 0) {
        if (page < lastPage) {
          setPage(page + 1);
        } else if (page !== 1) {
          setPage(1);
        }
        setPhotos([]);
        setLastPage(null);
        return;
      }
      if (index === 0) {
        if (page === 1) {
          setPrevPhotoId(null);
        } else {
          Api.photos.index(userId, filter, page - 1).then((response) => {
            const prevPhotos = response.data;
            if (prevPhotos.length > 0) {
              setPrevPhotoId(prevPhotos[prevPhotos.length - 1].id);
            } else {
              setPrevPhotoId(null);
            }
          });
        }
      } else {
        setPrevPhotoId(photos[index - 1].id);
      }
      if (index === photos.length - 1) {
        if (page === lastPage) {
          setNextPhotoId(null);
        } else {
          Api.photos.index(userId, filter, page + 1).then((response) => {
            const nextPhotos = response.data;
            if (nextPhotos.length > 0) {
              setNextPhotoId(nextPhotos[0].id);
            } else {
              setNextPhotoId(null);
            }
          });
        }
      } else {
        setNextPhotoId(photos[index + 1].id);
      }
    }
  }, [userId, filter, validPhotoId, photos, page, lastPage]);

  function onDeleted(id) {
    const index = photos.findIndex((photo) => photo.id === id);
    if (index >= 0) {
      photos.splice(index, 1);
      setPhotos([...photos]);
    }
  }

  function onClick(event, id) {
    event.preventDefault();
    if (!isDragging) {
      navigate(id);
    }
  }

  function onSortStart() {
    setDragging(true);
  }

  async function onSortEnd(event) {
    setTimeout(() => setDragging(false), 100);
    if (filter === 'all') {
      return;
    }
    try {
      await Api.photos.feature(event.item.dataset.id, filter, event.newIndex + 1);
    } catch (error) {
      console.log(error);
    }
  }

  const year = DateTime.now().year;
  let yearStarted;
  if (user && user.createdAt) {
    yearStarted = DateTime.fromISO(user.createdAt).year;
  }

  return (
    <main className="container">
      {validPhotoId ? (
        <Photo id={validPhotoId} page={page} nextId={nextPhotoId} prevId={prevPhotoId} onDeleted={onDeleted} />
      ) : (
        <>
          {user && (
            <div className="row justify-content-center mb-5">
              <div className="col-6 col-md-3 col-lg-2">
                <UserPhoto user={user} />
              </div>
              <div className="col-11 col-md-8 col-lg-6">
                <div className="user__header">
                  <h1 className="text-md-start mb-2">
                    {user.firstName} {user.lastName}
                  </h1>
                  {user.bio && <p>{user.bio}</p>}
                  {user.website && (
                    <p className="text-center text-md-start">
                      <a className="user__website" href={user.website}>
                        {user.website}
                      </a>
                    </p>
                  )}
                  {user.id === auth.user?.id && (
                    <div className="text-center text-md-start">
                      <Link to={`/members/${user.username}/edit`} className="btn btn-sm btn-outline-primary">
                        Edit Profile
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {yearStarted && (
            <nav className="d-flex justify-content-center">
              <ul className="pagination pagination-lg">
                {auth.user && (
                  <li className={classNames('page-item', { active: filter === 'all' })}>
                    <Link to={`../${userId}/all`} className="page-link">
                      All
                    </Link>
                  </li>
                )}
                {[...Array(year - yearStarted + 1)].map((_, i) => (
                  <li className={classNames('page-item', { active: filter === `${year - i}` })} key={`year-${year - i}`}>
                    <Link to={`../${userId}/${year - i}`} className="page-link">
                      {year - i}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <ReactSortable
            onStart={onSortStart}
            onEnd={onSortEnd}
            disabled={filter === 'all' || !user || user?.id !== auth.user?.id}
            className="row"
            list={photos}
            setList={setPhotos}>
            {photos.map((photo) => (
              <div key={photo.id} className="thumbnail col-md-6 col-lg-4 col-xl-3">
                <div className="thumbnail__content">
                  <Link to={photo.id} onClick={(event) => onClick(event, photo.id)} className="square">
                    <div className="square__content" style={{ backgroundImage: `url(${photo.thumbUrl})` }}></div>
                  </Link>
                </div>
              </div>
            ))}
          </ReactSortable>
          {filter === 'all' && lastPage && <Pagination page={page} lastPage={lastPage} url="" />}
        </>
      )}
    </main>
  );
}
export default User;
