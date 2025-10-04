import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

import DropzoneUploader from './DropzoneUploader';
import Spinner from './Spinner';

function FormFileGroup({ accept, children, className, disabled, file, id, label, onChangeFile, onUploading }) {
  function onRemoved() {
    console.log('removing?');
    const newFile = { ...file };
    newFile.file = null;
    if (newFile.fileURL) {
      delete newFile.fileURL;
    }
    newFile.fileName = null;
    console.log('removed?', newFile);
    onChangeFile(newFile);
  }

  function onUploaded(status) {
    const newFile = { ...file };
    newFile.file = status.signedId;
    newFile.fileName = status.file.name;
    onChangeFile(newFile);
  }

  return (
    <>
      <div className="mb-3">
        <label className="form-label" htmlFor="file">
          {label}
        </label>
        <fieldset className="d-flex align-items-center">
          <DropzoneUploader
            id={id}
            className={classNames('file-input', 'card', 'w-100', className)}
            accept={accept}
            multiple={false}
            disabled={disabled || (!!file.file && file.file !== '')}
            onRemoved={onRemoved}
            onUploaded={onUploaded}
            onUploading={onUploading}>
            {({ statuses, onRemove }) => {
              if (statuses.length > 0) {
                return statuses.map((s) => (
                  <div key={s.id} className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="me-3">{s.file.name}</span>
                      {(s.status === 'pending' || s.status === 'uploading') && <Spinner className="my-2" size="sm" />}
                      {!(s.status === 'pending' || s.status === 'uploading') && (
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onRemove(s)}>
                          <FontAwesomeIcon icon={faTrashCan} />
                        </button>
                      )}
                    </div>
                  </div>
                ));
              } else if (statuses.length === 0 && file.file) {
                return (
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="me-3">{file.fileName ?? file.file?.substring(file.file.lastIndexOf('/') + 1)}</span>
                      <div>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRemoved}>
                          <FontAwesomeIcon icon={faTrashCan} />
                        </button>
                        <a className="btn btn-sm btn-outline-secondary ms-2" download={file.fileName} href={file.fileURL}>
                          <FontAwesomeIcon icon={faDownload} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              } else if (statuses.length === 0 && !file.file) {
                return (
                  <div className="card-body">
                    <div className="card-text text-muted clickable">
                      <b>Drag-and-drop</b> a file here,
                      <br />
                      or <b>click here</b> to browse and select a file.
                    </div>
                  </div>
                );
              }
            }}
          </DropzoneUploader>
          {children}
        </fieldset>
      </div>
    </>
  );
}

FormFileGroup.propTypes = {
  accept: PropTypes.object,
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  file: PropTypes.shape({
    file: PropTypes.string,
    fileURL: PropTypes.string,
    fileName: PropTypes.string,
  }),
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onChangeFile: PropTypes.func.isRequired,
  onUploading: PropTypes.func.isRequired,
};

export default FormFileGroup;
