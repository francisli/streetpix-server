import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import inflection from 'inflection';
import { DateTime } from 'luxon';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { Link } from 'react-router-dom';

import License from '../Components/License';
import { useAuthContext } from '../AuthContext';

import PhotoFeature from './PhotoFeature';
import PhotoRating from './PhotoRating';

function PhotoPanel({ isFullScreen, prevId, listUrl, nextId, data, onChangeRating, onEdit, onFullScreen }) {
  const { user } = useAuthContext();

  const ratings = [0, 0, 0, 0, 0];
  let rating;
  if (data) {
    data.Ratings.forEach((r) => {
      ratings[5 - r.value] += r.UserId !== data.UserId ? 1 : 0;
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
                  {[...Array(5 - index)].map((_, i) => (
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

  let cameraModel = null;
  if (data?.metadata?.exif?.Make || data?.metadata?.exif?.Model) {
    const make = inflection.capitalize(data.metadata?.exif?.Make?.description ?? '');
    let model = data.metadata?.exif?.Model?.description ?? '';
    if (model.startsWith(`${make} `)) {
      model = model.substring(make.length + 1);
    }
    cameraModel = `${make} ${model}`.trim();
  }

  return (
    <>
      {!isFullScreen && (
        <div className="row mb-3">
          <div className="col-4">
            {prevId && (
              <Link to={prevId} className="btn btn-link p-0 text-secondary">
                &lArr; Prev
              </Link>
            )}
          </div>
          <div className="col-4 text-center">
            {listUrl !== '/' && (
              <Link to={listUrl} className="btn btn-link p-0 text-secondary">
                Back to List
              </Link>
            )}
          </div>
          <div className="col-4 text-end">
            {nextId && (
              <Link to={nextId} className="btn btn-link p-0 text-secondary">
                Next &rArr;
              </Link>
            )}
          </div>
        </div>
      )}
      <div className="row">
        <div className="col-md-8">
          {(data.caption || data.description) && (
            <dl>
              <dt>{data.caption}</dt>
              <dd>{data.description}</dd>
            </dl>
          )}
          <div className="row">
            <div className="col-6">
              <dl className="small">
                <dt>Taken by:</dt>
                <dd>
                  {isFullScreen && (
                    <>
                      {data.User?.firstName} {data.User?.lastName}
                    </>
                  )}
                  {!isFullScreen && (
                    <Link to={`/members/${data.User.username}`}>
                      {data.User?.firstName} {data.User?.lastName}
                    </Link>
                  )}
                </dd>
                {user && data.takenAt && (
                  <>
                    <dt>Taken on:</dt>
                    <dd>{DateTime.fromISO(data.takenAt).toLocaleString(DateTime.DATETIME_MED)}</dd>
                  </>
                )}
                <dt>License:</dt>
                <dd>
                  <License selected={data.license} />
                </dd>
              </dl>
            </div>
            <div className="col-6">
              {user && (
                <dl className="small">
                  {cameraModel && (
                    <>
                      <dt>Camera model:</dt>
                      <dd>{cameraModel}</dd>
                    </>
                  )}
                  {data.metadata?.exif?.LensModel && (
                    <>
                      <dt>Lens model:</dt>
                      <dd>{data.metadata.exif.LensModel.description}</dd>
                    </>
                  )}
                  {(data.metadata?.exif?.FNumber || data.metadata?.exif?.ISOSpeedRatings) && (
                    <div className="d-flex">
                      {data.metadata?.exif?.FNumber && (
                        <div className="flex-fill">
                          <dt>F-stop:</dt>
                          <dd>{data.metadata.exif.FNumber.description}</dd>
                        </div>
                      )}
                      {data.metadata?.exif?.ShutterSpeedValue && (
                        <div className="flex-fill">
                          <dt>Shutter:</dt>
                          <dd>{data.metadata.exif.ShutterSpeedValue.description}</dd>
                        </div>
                      )}
                      {data.metadata?.exif?.ISOSpeedRatings && (
                        <div className="flex-fill">
                          <dt>ISO:</dt>
                          <dd>{data.metadata.exif.ISOSpeedRatings.description}</dd>
                        </div>
                      )}
                    </div>
                  )}
                </dl>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-3 offset-md-1">
          <dl className="small">
            {!isFullScreen && (
              <dd className="d-flex gap-2 mb-3">
                {listUrl !== '/' && (
                  <button onClick={onFullScreen} className="btn btn-sm btn-outline-secondary">
                    Full Screen
                  </button>
                )}
                {data.User?.id === user?.id && (
                  <button onClick={onEdit} type="button" className="btn btn-sm btn-outline-secondary">
                    Edit
                  </button>
                )}
              </dd>
            )}
            {user && (
              <>
                <div className="d-flex">
                  <div className="flex-fill">
                    <dt>Avg. rating:</dt>
                    <dd>
                      {isFullScreen && (
                        <>
                          <FontAwesomeIcon icon={faStarSolid} /> {data.rating.toFixed(1)}
                        </>
                      )}
                      {!isFullScreen && (
                        <OverlayTrigger trigger="click" placement="top" overlay={popover}>
                          <button type="button" className="btn btn-sm btn-link p-0">
                            <FontAwesomeIcon icon={faStarSolid} /> {data.rating.toFixed(1)}
                          </button>
                        </OverlayTrigger>
                      )}
                    </dd>
                  </div>
                  <div className="flex-fill">
                    <dt>Your rating:</dt>
                    <dd>
                      <PhotoRating onChange={onChangeRating} value={rating?.value} />
                    </dd>
                  </div>
                </div>
              </>
            )}
            {!isFullScreen && user && user.id === data.UserId && (
              <>
                <dt>Public visibility:</dt>
                <dd>
                  <PhotoFeature photo={data} />
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>
      {isFullScreen && (
        <div className="row mb-3">
          <div className="col-4">
            {prevId && (
              <Link to={prevId} className="btn btn-outline-primary">
                &lArr; Prev
              </Link>
            )}
          </div>
          <div className="col-4 text-center">
            {listUrl !== '/' && (
              <Link to={listUrl} className="btn btn-outline-primary">
                Back to List
              </Link>
            )}
          </div>
          <div className="col-4 text-end">
            {nextId && (
              <Link to={nextId} className="btn btn-outline-primary">
                Next &rArr;
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
export default PhotoPanel;
