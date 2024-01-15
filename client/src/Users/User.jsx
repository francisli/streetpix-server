import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactSortable from 'react-sortablejs';
import classNames from 'classnames';
import { DateTime } from 'luxon';

import { useAuthContext } from '../AuthContext';
import Api from '../Api';
import Photo from '../Photos/Photo';
import Photos from '../Photos/Photos';

import './User.scss';
import UserPhoto from './UserPhoto';

function User() {
  const auth = useAuthContext();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isDragging, setDragging] = useState(false);

  const { search } = useLocation();
  const [page, setPage] = useState();
  const [lastPage, setLastPage] = useState(null);
  const [sort, setSort] = useState();

  const { userId, year, photoId } = useParams();
  const [nextPhotoId, setNextPhotoId] = useState();
  const [prevPhotoId, setPrevPhotoId] = useState();

  const validPhotoId = photoId !== 'edit' ? photoId : undefined;

  useEffect(() => {
    if (userId) {
      Api.users.get(userId).then((response) => setUser(response.data));
    }
  }, [userId]);

  useEffect(() => {
    if (!validPhotoId || !page || !sort) {
      const params = new URLSearchParams(search);
      const newPage = parseInt(params.get('page') ?? '1', 10);
      if (newPage !== page) {
        setPage(newPage);
      }
      const newSort = params.get('sort') ?? 'meeting';
      if (year === 'all' && newSort !== sort) {
        setSort(newSort);
      }
    }
  }, [year, validPhotoId, search, page, sort]);

  useEffect(() => {
    if (userId && page && (year !== 'all' || sort)) {
      Api.photos.index({ userId, year, page, sort }).then((response) => {
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
  }, [userId, year, page, sort]);

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
          Api.photos.index({ userId, year, sort, page: page - 1 }).then((response) => {
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
          Api.photos.index({ userId, year, sort, page: page + 1 }).then((response) => {
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
  }, [userId, year, sort, validPhotoId, photos, page, lastPage]);

  function onSort(event) {
    navigate(`?sort=${event.target.value}`);
  }

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

  function onReorderStart() {
    setDragging(true);
  }

  async function onReorderEnd(event) {
    setTimeout(() => setDragging(false), 100);
    if (year === 'all') {
      return;
    }
    try {
      await Api.photos.feature(event.item.dataset.id, year, event.newIndex + 1);
    } catch (error) {
      console.log(error);
    }
  }

  const currentYear = DateTime.now().year - (auth.user ? 0 : 1);
  let yearStarted;
  if (user && user.createdAt) {
    yearStarted = DateTime.fromISO(user.createdAt).year;
  }

  return (
    <main className="container">
      {validPhotoId ? (
        <Photo id={validPhotoId} page={page} sort={sort} nextId={nextPhotoId} prevId={prevPhotoId} onDeleted={onDeleted} />
      ) : (
        <>
          {user && (
            <div className="row justify-content-center mb-5">
              <div className="col-6 col-md-3 col-lg-2">
                <UserPhoto className="mb-3" user={user} />
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
                  <li className={classNames('page-item', { active: year === 'all' })}>
                    <Link to={`../${userId}/all`} className="page-link">
                      All
                    </Link>
                  </li>
                )}
                {[...Array(currentYear - yearStarted + 1)].map((_, i) => (
                  <li className={classNames('page-item', { active: year === `${currentYear - i}` })} key={`year-${currentYear - i}`}>
                    <Link to={`../${userId}/${currentYear - i}`} className="page-link">
                      {currentYear - i}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {year === 'all' && <Photos lastPage={lastPage} page={page} photos={photos} sort={sort} onSort={onSort} />}
          {year !== 'all' && photos.length === 0 && <div className="text-center my-5">No photos yet.</div>}
          {year !== 'all' && (
            <ReactSortable.ReactSortable
              onStart={onReorderStart}
              onEnd={onReorderEnd}
              disabled={!user || user?.id !== auth.user?.id}
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
            </ReactSortable.ReactSortable>
          )}
        </>
      )}
    </main>
  );
}
export default User;
