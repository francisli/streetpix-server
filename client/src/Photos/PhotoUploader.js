import classNames from 'classnames';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import DropzoneUploader from '../Components/DropzoneUploader';

import PhotoForm from './PhotoForm';

import './PhotoUploader.scss';

function PhotoUploader({ id, className, maxFiles, meetingId }) {
  const { user } = useAuthContext();

  async function onUploaded(status) {
    try {
      const data = {
        filename: status.file.name,
        file: status.signedId,
        license: user?.license,
        acquireLicensePage: user?.acquireLicensePage,
      };
      let response;
      if (meetingId) {
        response = await Api.meetings.submit(meetingId, data);
        response.data = response.data.Photo;
      } else {
        response = await Api.photos.create(data);
      }
      status.photoId = response.data.id;
      status.status = 'submitted';
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <DropzoneUploader
      id={id}
      className={classNames('photouploader', className)}
      multiple={true}
      maxFiles={maxFiles}
      onUploaded={onUploaded}>
      {({ statuses, onRemove, rejectedFiles }) => {
        if (statuses.length === 0) {
          return (
            <div className="photouploader__prompt card">
              <div className="card-body">
                <div className="card-text text-center">Drag-and-drop photo files here, or click here to browse and select files.</div>
                {rejectedFiles?.length > maxFiles && (
                  <div className="card-text text-center mt-3">
                    <b>Too many files!</b>
                  </div>
                )}
              </div>
            </div>
          );
        } else {
          return statuses
            .sort((a, b) => a.file.name.localeCompare(b.file.name))
            .map((status) => (
              <div key={status.id} className="card mb-4">
                <div className="card-body">
                  <div className="row">
                    <div className="col-4">
                      <div className="square">
                        <div className="square__content" style={{ backgroundImage: `url(${status.file.preview})` }}></div>
                      </div>
                    </div>
                    <div className="col-8">
                      {status.status !== 'submitted' && <span>Please wait...</span>}
                      {status.status === 'submitted' && <PhotoForm id={status.photoId} onDeleted={() => onRemove(status)} />}
                    </div>
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
