import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';

import Pagination from '../Components/Pagination';

import './Photos.scss';

function Photos({ showName, lastPage, page, photos, sort, onSort }) {
  return (
    <>
      <div className="row">
        <div className="col-lg-3 col-xl-2">
          <dl className="photos__options">
            <dt>Sort</dt>
            <dd>
              <select className="form-select" onChange={onSort} value={sort}>
                <option value="meeting">Meeting date</option>
                <option value="createdAt">Upload date</option>
                <option value="takenAt">Capture date</option>
                <option value="rating">Avg. rating</option>
                <option value="myRating">My rating</option>
              </select>
            </dd>
          </dl>
        </div>
        <div className="offset-lg-1 col-lg-8 col-xl-9">
          <div className="row">
            {photos.length === 0 && <div className="text-center my-5">No photos yet.</div>}
            {photos.map((photo) => (
              <div key={photo.id} className="thumbnail col-md-6 col-xl-4">
                <div className="thumbnail__content">
                  <Link to={photo.id} className="square mb-3">
                    <div className="square__content" style={{ backgroundImage: `url(${photo.thumbUrl})` }}></div>
                  </Link>
                  {showName && (
                    <div className="thumbnail__metadata">
                      {photo.User.firstName} {photo.User.lastName}
                    </div>
                  )}
                  {sort === 'meeting' && (
                    <div className="thumbnail__metadata">
                      Meeting: {DateTime.fromISO(photo?.MeetingSubmission?.Meeting?.startsAt).toLocaleString(DateTime.DATE_SHORT)}
                    </div>
                  )}
                  {sort === 'createdAt' && (
                    <div className="thumbnail__metadata">
                      Uploaded: {DateTime.fromISO(photo?.createdAt).toLocaleString(DateTime.DATE_SHORT)}
                    </div>
                  )}
                  {sort === 'takenAt' && (
                    <div className="thumbnail__metadata">Taken: {DateTime.fromISO(photo?.takenAt).toLocaleString(DateTime.DATE_SHORT)}</div>
                  )}
                  {sort === 'myRating' && (
                    <div className="thumbnail__metadata">
                      You: <FontAwesomeIcon icon={faStarSolid} /> {photo.Ratings?.[0].value.toFixed(1)}
                    </div>
                  )}
                  {photo.rating > 0 && (
                    <div className="thumbnail__metadata">
                      Avg: <FontAwesomeIcon icon={faStarSolid} /> {photo.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {lastPage && <Pagination page={page} lastPage={lastPage} otherParams={{ sort }} />}
    </>
  );
}
export default Photos;
