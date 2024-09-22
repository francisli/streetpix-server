import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';

import './Comment.scss';

function Comment({ data }) {
  return (
    <div className="comment">
      <div className="square comment__thumbnail">
        <Link to={data.Photo.id} className="square__content" style={{ backgroundImage: `url(${data.Photo?.thumbUrl})` }}></Link>
      </div>
      <div className="comment__content">
        <div className="comment__metadata">
          <b>
            {data.User?.firstName} {data.User?.lastName}
          </b>
          <span className="text-muted ms-1">
            {DateTime.fromISO(data.createdAt).toRelative({ style: 'narrow' })}
            {data.updatedAt !== data.createdAt && (
              <span> (updated {DateTime.fromISO(data.updatedAt).toRelative({ style: 'narrow' })})</span>
            )}
          </span>
        </div>
        <div>{data.body}</div>
      </div>
    </div>
  );
}

Comment.propTypes = {
  data: PropTypes.object,
};

export default Comment;
