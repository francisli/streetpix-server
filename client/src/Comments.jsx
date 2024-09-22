import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Api from './Api';
import Comment from './Comments/Comment';
import Pagination from './Components/Pagination';
import Photo from './Photos/Photo';

function Comments() {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const { search } = useLocation();
  const [page, setPage] = useState();
  const [lastPage, setLastPage] = useState(null);

  const { photoId } = useParams();
  const [nextPhotoId, setNextPhotoId] = useState();
  const [prevPhotoId, setPrevPhotoId] = useState();

  useEffect(() => {
    if (!photoId || !page) {
      const params = new URLSearchParams(search);
      const newPage = parseInt(params.get('page') ?? '1', 10);
      if (newPage !== page) {
        setPage(newPage);
      }
    }
  }, [photoId, search, page]);

  useEffect(() => {
    if (page) {
      Api.comments.index({ page }).then((response) => {
        setComments(response.data);
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
  }, [page]);

  useEffect(() => {
    if (photoId && comments && page && lastPage) {
      async function search() {
        // find the first index of a comment with this photo
        const index = comments.findIndex((c) => c.Photo.id === photoId);
        if (index < 0) {
          // not found, go to next page (if any) or reset to beginning
          if (page < lastPage) {
            setPage(page + 1);
          } else if (page !== 1) {
            setPage(1);
          }
          setComments([]);
          setLastPage(null);
          return;
        }
        // search backwards, paginating if necessary, to find the first prev photo if any
        let searchPhotoId;
        let searchComments = comments;
        let searchIndex = index;
        let searchPage = page;
        for (;;) {
          while (searchIndex > 0) {
            if (searchComments[searchIndex - 1].Photo.id !== photoId) {
              searchPhotoId = searchComments[searchIndex - 1].Photo.id;
              break;
            }
            searchIndex -= 1;
          }
          if (searchPhotoId || searchPage === 1) {
            break;
          }
          // not found, so go to prev page
          searchPage -= 1;
          const response = await Api.comments.index({ page: searchPage });
          searchComments = response.data;
          searchIndex = searchComments.length;
        }
        setPrevPhotoId(searchPhotoId);
        // search forwards, paginating if necessary, to find the next photo if any
        searchPhotoId = undefined;
        searchComments = comments;
        searchIndex = index;
        searchPage = page;
        for (;;) {
          while (searchIndex < searchComments.length - 1) {
            if (searchComments[searchIndex + 1].Photo.id !== photoId) {
              searchPhotoId = searchComments[searchIndex + 1].Photo.id;
              break;
            }
            searchIndex += 1;
          }
          if (searchPhotoId || searchPage == lastPage) {
            break;
          }
          // not found, so go to next page
          searchPage += 1;
          const response = await Api.comments.index({ page: searchPage });
          searchComments = response.data;
          searchIndex = -1;
        }
        setNextPhotoId(searchPhotoId);
      }
      search();
    }
  }, [photoId, comments, page, lastPage]);

  function onDeleted(id) {
    const index = comments.findIndex((photo) => photo.id === id);
    if (index >= 0) {
      comments.splice(index, 1);
      setComments([...comments]);
    }
  }

  return (
    <main className="container">
      {photoId ? (
        <Photo id={photoId} page={page} nextId={nextPhotoId} prevId={prevPhotoId} onDeleted={onDeleted} />
      ) : (
        <>
          <h1>Comments</h1>
          <div>
            {comments?.map((c) => (
              <Comment key={c.id} data={c} />
            ))}
          </div>
          {lastPage && <Pagination page={page} lastPage={lastPage} />}
        </>
      )}
    </main>
  );
}
export default Comments;
