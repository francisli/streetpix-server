import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

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
      <hr />
      <div className="mb-3">
        <div className="d-flex justify-content-between">
          <label htmlFor="notes" className="form-label">
            My Private Notes:
          </label>
          {isLoading && (
            <div className="text-muted">
              Saving... <div className="spinner-border spinner-border-sm"></div>
            </div>
          )}
          {!isLoading && isSaved === data.id && (
            <div className="text-muted">
              Saved! <FontAwesomeIcon icon={faCheck} />
            </div>
          )}
        </div>
        <textarea id="notes" name="notes" value={data?.notes ?? ''} onChange={onChange} className="form-control" />
      </div>
    </>
  );
}
export default NotesPanel;
