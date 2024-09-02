import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

import Api from '../Api';

function NotesPanel({ data, onUpdated }) {
  const [isLoading, setLoading] = useState(false);
  const [isSaved, setSaved] = useState(false);
  const timeoutRef = useRef();

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  function onChange(event) {
    const newData = { ...data };
    newData.notes = event.target.value;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        await Api.photos.update(data.id, { notes: newData.notes });
        setSaved(newData.id);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }, 500);
    onUpdated(newData);
    setSaved(false);
  }

  return (
    <>
      <div className="mb-3">
        <textarea id="notes" name="notes" value={data?.notes ?? ''} onChange={onChange} className="form-control mb-1" />
        <div className="d-flex justify-content-end">
          {isLoading && (
            <div className="text-muted">
              <small>
                Saving... <div className="spinner-border spinner-border-sm"></div>
              </small>
            </div>
          )}
          {!isLoading && isSaved === data.id && (
            <div className="text-muted text-small">
              <small>
                Saved! <FontAwesomeIcon icon={faCheck} />
              </small>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

NotesPanel.propTypes = {
  data: PropTypes.object,
  onUpdated: PropTypes.func,
};

export default NotesPanel;
