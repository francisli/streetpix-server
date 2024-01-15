import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Api from './Api';
import Photo from './Photos/Photo';
import Photos from './Photos/Photos';

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
      const newSort = params.get('sort') ?? 'meeting';
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
    navigate(`?sort=${event.target.value}`);
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
        <Photos showName={true} lastPage={lastPage} page={page} photos={photos} sort={sort} onSort={onSort} />
      )}
    </main>
  );
}
export default Browse;
