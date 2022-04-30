import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useRouteMatch } from 'react-router-dom';

import { useAuthContext } from '../AuthContext';
import Api from '../Api';
import Pagination from '../Components/Pagination';
import Photo from '../Photos/Photo';

import './User.scss';

function User({ userId }) {
  const auth = useAuthContext();
  const { url } = useRouteMatch();

  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);

  const { search } = useLocation();
  const [page, setPage] = useState(null);
  const [lastPage, setLastPage] = useState(null);

  const { photoId } = useParams();
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
      Api.photos.index(userId, page).then((response) => {
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
  }, [userId, page]);

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
          Api.photos.index(userId, page - 1).then((response) => {
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
          Api.photos.index(userId, page + 1).then((response) => {
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
  }, [userId, validPhotoId, photos, page, lastPage]);

  return (
    <main className="container">
      {validPhotoId ? (
        <Photo userId={userId} id={validPhotoId} page={page} nextId={nextPhotoId} prevId={prevPhotoId} />
      ) : (
        <>
          {user && (
            <div className="row text-center mb-5">
              <h1>
                {user.firstName} {user.lastName}
              </h1>
              {user.bio && <p className="text-start">{user.bio}</p>}
              {user.website && (
                <p>
                  <a className="user__website" href={user.website}>
                    {user.website}
                  </a>
                </p>
              )}
              {user.id === auth.user?.id && (
                <div>
                  <Link to={`/members/${user.username}/edit`} className="btn btn-sm btn-outline-primary">
                    Edit Profile
                  </Link>
                </div>
              )}
            </div>
          )}
          <div className="row">
            {photos.map((photo) => (
              <div key={photo.id} className="thumbnail col-md-6 col-lg-4 col-xl-3">
                <div className="thumbnail__content">
                  <Link to={`${url}/${photo.id}`} className="square">
                    <div className="square__content" style={{ backgroundImage: `url(${photo.thumbUrl})` }}></div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {lastPage && <Pagination page={page} lastPage={lastPage} url={url} />}
        </>
      )}
    </main>
  );
}
export default User;
