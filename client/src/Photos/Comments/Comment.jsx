import { useState } from 'react';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';

import Api from '../../Api';
import { useAuthContext } from '../../AuthContext';

function Comment({ data, onDelete, onError, onUpdated }) {
  const { user } = useAuthContext();
  const [isEditing, setEditing] = useState(false);
  const [body, setBody] = useState(data.body);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await Api.comments.update(data.id, { body });
      onUpdated(response.data);
      setEditing(false);
    } catch (error) {
      onError(error);
    }
  }

  function onKeyDown(event) {
    if (event.keyCode == 13) {
      onSubmit(event);
    }
  }

  function onCancel() {
    setBody(data.body);
    setEditing(false);
  }

  return (
    <div className="mb-2">
      <div>
        <small className="text-muted">
          <b>
            {data.User?.firstName} {data.User?.lastName}
          </b>{' '}
          <span className="text-muted ms-1">
            {DateTime.fromISO(data.createdAt).toRelative({ style: 'narrow' })}
            {data.updatedAt !== data.createdAt && (
              <span> (updated {DateTime.fromISO(data.updatedAt).toRelative({ style: 'narrow' })})</span>
            )}
          </span>
          {data.UserId === user.id && (
            <span>
              {' '}
              -{' '}
              <button className="btn btn-sm btn-link btn-link--text" onClick={() => setEditing(!isEditing)}>
                Edit
              </button>{' '}
              -{' '}
              <button className="btn btn-sm btn-link btn-link--text" onClick={() => onDelete(data)}>
                Delete
              </button>
            </span>
          )}
        </small>
      </div>
      {!isEditing && <div>{data.body}</div>}
      {isEditing && (
        <div>
          <form onSubmit={onSubmit}>
            <textarea
              className="form-control mb-2"
              value={body}
              onKeyDown={onKeyDown}
              onChange={(event) => setBody(event.target.value)}></textarea>
            <button className="btn btn-sm btn-outline-secondary" type="submit">
              Submit
            </button>
            <span className="text-muted">
              <small>&nbsp;or&nbsp;</small>
              <button className="btn btn-sm btn-link btn-link--text" onClick={onCancel}>
                Cancel
              </button>
            </span>
          </form>
        </div>
      )}
    </div>
  );
}

Comment.propTypes = {
  data: PropTypes.object,
  onDelete: PropTypes.func,
  onError: PropTypes.func,
  onUpdated: PropTypes.func,
};

export default Comment;
