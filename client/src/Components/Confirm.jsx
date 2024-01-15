import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';

function Confirm({ isShowing, onHide, onConfirm, title, children, cancelLabel, dangerLabel, primaryLabel }) {
  return (
    <Modal centered show={isShowing} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        {cancelLabel && (
          <button onClick={onHide} type="button" className="btn btn-outline-secondary">
            {cancelLabel}
          </button>
        )}
        {dangerLabel && (
          <button onClick={onConfirm} type="button" className="btn btn-outline-danger">
            {dangerLabel}
          </button>
        )}
        {primaryLabel && (
          <button onClick={onConfirm} type="button" className="btn btn-outline-primary">
            {primaryLabel}
          </button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

Confirm.propTypes = {
  isShowing: PropTypes.bool,
  onHide: PropTypes.func,
  onConfirm: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  cancelLabel: PropTypes.string,
  dangerLabel: PropTypes.string,
  primaryLabel: PropTypes.string,
};

export default Confirm;
