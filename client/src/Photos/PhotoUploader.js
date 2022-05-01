import classNames from 'classnames';

import DropzoneUploader from '../Components/DropzoneUploader';

import PhotoForm from './PhotoForm';

import './PhotoUploader.scss';

function PhotoUploader({ id, className, maxFiles, meetingId }) {
  return (
    <DropzoneUploader id={id} className={classNames('photouploader', className)} multiple={true} maxFiles={maxFiles}>
      {(statuses) => {
        if (statuses.length === 0) {
          return (
            <div className="photouploader__prompt card">
              <div className="card-body">
                <div className="card-text text-center">Drag-and-drop photo files here, or click here to browse and select files.</div>
              </div>
            </div>
          );
        } else {
          return statuses.map((status) => (
            <div key={status.id} className="card mb-4">
              <div className="card-body">
                <div className="row">
                  <div className="col-4">
                    <div className="square">
                      <div className="square__content" style={{ backgroundImage: `url(${status.file.preview})` }}></div>
                    </div>
                  </div>
                  <div className="col-8">{status.status === 'uploaded' && <PhotoForm file={status.signedId} meetingId={meetingId} />}</div>
                </div>
              </div>
            </div>
          ));
        }
      }}
    </DropzoneUploader>
  );
}

export default PhotoUploader;
