import { useState } from 'react';
import PropTypes from 'prop-types';

import Api from '../../Api';
import Confirm from '../../Components/Confirm';
import Comment from './Comment';

function CommentsPanel({ data, onUpdated }) {
  const [body, setBody] = useState('');

  const [commentData, setCommentData] = useState();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [error, setError] = useState();

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await Api.comments.create({ PhotoId: data.id, body });
      const newData = { ...data };
      newData.Comments ||= [];
      newData.Comments.push(response.data);
      onUpdated(newData);
      setBody('');
    } catch (error) {
      setError(error);
    }
  }

  function onKeyDown(event) {
    if (event.keyCode == 13) {
      onSubmit(event);
    }
  }

  function onUpdatedComment(commentData) {
    const newData = { ...data };
    const index = newData.Comments.findIndex((c) => c.id === commentData.id);
    if (index >= 0) {
      newData.Comments[index] = commentData;
      onUpdated(newData);
    }
  }

  function onDelete(deleteCommentData) {
    setCommentData(deleteCommentData);
    setShowConfirmDelete(true);
  }

  async function onDeleteConfirmed() {
    try {
      await Api.comments.delete(commentData.id);
      const newData = { ...data };
      const index = newData.Comments.findIndex((c) => c.id === commentData.id);
      if (index >= 0) {
        newData.Comments.splice(index, 1);
        onUpdated(newData);
      }
    } catch (error) {
      setError(error);
    } finally {
      setCommentData();
      setShowConfirmDelete(false);
    }
  }

  function hideConfirmDeleteModal() {
    setCommentData();
    setShowConfirmDelete(false);
  }

  return (
    <div>
      <div className="mb-3">
        {data.Comments?.map((c) => (
          <Comment key={c.id} data={c} onDelete={onDelete} onError={setError} onUpdated={onUpdatedComment} />
        ))}
      </div>
      <div>
        <form onSubmit={onSubmit}>
          <textarea
            className="form-control mb-2"
            placeholder="Add a new comment..."
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={onKeyDown}
            value={body}></textarea>
          <button className="btn btn-sm btn-outline-secondary" type="submit">
            Submit
          </button>
        </form>
      </div>
      <Confirm
        isShowing={showConfirmDelete}
        onHide={hideConfirmDeleteModal}
        onConfirm={onDeleteConfirmed}
        title="Are you sure?"
        cancelLabel="Cancel"
        dangerLabel="Delete">
        Are you sure you wish to delete the comment <b>&ldquo;{commentData?.body}&rdquo;</b>? This cannot be undone.
      </Confirm>
      <Confirm isShowing={!!error} onHide={() => setError()} onConfirm={() => setError()} title="Error" primaryLabel="OK">
        An unexpected error has occurred, please try again shortly. If it continues to occur, please report details of the action you were
        trying to perform and this message:
        <br />
        <br />
        <b>{error?.message}</b>
      </Confirm>
    </div>
  );
}

CommentsPanel.propTypes = {
  data: PropTypes.object,
  onUpdated: PropTypes.func,
};

export default CommentsPanel;
