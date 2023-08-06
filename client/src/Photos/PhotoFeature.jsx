import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { DateTime } from 'luxon';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';

function PhotoFeature({ photo }) {
  const { user } = useAuthContext();
  const [year, setYear] = useState();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setYear(photo?.Feature?.year ?? '');
  }, [photo]);

  const currentYear = DateTime.now().year;
  let yearStarted;
  if (user && user.createdAt) {
    yearStarted = DateTime.fromISO(user.createdAt).year;
    if (photo.takenAt) {
      yearStarted = Math.max(yearStarted, DateTime.fromISO(photo.takenAt).year);
    }
  }

  async function onChange(event) {
    const newYear = event.target.value;
    try {
      await Api.photos.feature(photo.id, newYear);
      setYear(newYear);
    } catch (error) {
      setShowModal(true);
    }
  }

  return (
    <>
      <select onChange={onChange} className="form-select form-select-sm" value={year} style={{ width: 'auto' }}>
        <option value="">Not featured</option>
        {[...Array(currentYear - yearStarted + 1)].map((_, i) => (
          <option key={currentYear - i} value={currentYear - i}>
            {currentYear - i}
          </option>
        ))}
      </select>
      <Modal show={showModal} animation={false} centered>
        <Modal.Header>
          <Modal.Title>An error has occurred</Modal.Title>
        </Modal.Header>
        <Modal.Body>There are already 12 photos featured for that year.</Modal.Body>
        <Modal.Footer>
          <button onClick={() => setShowModal(false)} type="button" className="btn btn-primary">
            OK
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
export default PhotoFeature;
