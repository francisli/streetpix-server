import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';

import Api from './Api';
import Pagination from './Components/Pagination';
import Photo from './Photos/Photo';

import './Browse.scss';

function Browse() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const { search } = useLocation();
  const [page, setPage] = useState();
  const [lastPage, setLastPage] = useState(null);
  const [sort, setSort] = useState();

  const { photoId } = useParams();
  const [nextPhotoId, setNextPhotoId] = useState();
  const [prevPhotoId, setPrevPhotoId] = useState();

  useEffect(() => {
    if (!photoId || !page || !sort) {
      const params = new URLSearchParams(search);
      const newPage = parseInt(params.get('page') ?? '1', 10);
      if (newPage !== page) {
        setPage(newPage);
      }
      const newSort = params.get('sort') ?? 'createdAt';
      if (newSort !== sort) {
        setSort(newSort);
      }
    }
  }, [photoId, search, page, sort]);

  useEffect(() => {
    if (page && sort) {
      Api.photos.index({ page, sort }).then((response) => {
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
  }, [page, sort]);

  useEffect(() => {
    if (photoId && photos && page && lastPage) {
      const index = photos.findIndex((photo) => photo.id === photoId);
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
          Api.photos.index({ sort, page: page - 1 }).then((response) => {
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
          Api.photos.index({ sort, page: page + 1 }).then((response) => {
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
  }, [sort, photoId, photos, page, lastPage]);

  function onSort(event) {
    navigate(`?page=${page}&sort=${event.target.value}`);
  }

  function onDeleted(id) {
    const index = photos.findIndex((photo) => photo.id === id);
    if (index >= 0) {
      photos.splice(index, 1);
      setPhotos([...photos]);
    }
  }

  return (
    <main className="container">
      <h1>Browse</h1>
      {photoId ? (
        <Photo id={photoId} page={page} sort={sort} nextId={nextPhotoId} prevId={prevPhotoId} onDeleted={onDeleted} />
      ) : (
        <>
          <div className="row">
            <div className="col-lg-3 col-xl-2">
              <dl className="browse__options">
                <dt>Sort</dt>
                <dd>
                  <select className="form-select" onChange={onSort} value={sort}>
                    <option value="createdAt">Upload date</option>
                    <option value="takenAt">Capture date</option>
                    <option value="rating">Avg. rating</option>
                  </select>
                </dd>
              </dl>
            </div>
            <div className="offset-lg-1 col-lg-8 col-xl-9">
              <div className="row">
                {photos.map((photo) => (
                  <div key={photo.id} className="thumbnail col-md-6 col-xl-4">
                    <div className="thumbnail__content">
                      <Link to={photo.id} className="square">
                        <div className="square__content" style={{ backgroundImage: `url(${photo.thumbUrl})` }}></div>
                      </Link>
                      <div className="browse__thumbnail-metadata mt-2">
                        {photo.rating > 0 && (
                          <>
                            <FontAwesomeIcon icon={faStarSolid} /> {photo.rating.toFixed(1)}
                          </>
                        )}
                      </div>
                      <div className="browse__thumbnail-metadata">
                        {photo.User.firstName} {photo.User.lastName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {lastPage && <Pagination page={page} lastPage={lastPage} otherParams={{ sort }} />}
        </>
      )}
    </main>
  );
}
export default Browse;
