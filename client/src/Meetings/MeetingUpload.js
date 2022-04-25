import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import PhotoUploader from '../Photos/PhotoUploader';

function MeetingUpload() {
  const { user } = useAuthContext();
  const { meetingId } = useParams();
  const [meeting, setMeeting] = useState();

  useEffect(() => {
    if (meetingId) {
      Api.meetings.get(meetingId).then((response) => setMeeting(response.data));
    }
  }, [meetingId]);

  let priorSubmissions = [];
  let uploadsRemaining = 0;
  if (meeting) {
    priorSubmissions = meeting.MeetingSubmissions.filter((ms) => ms.Photo.UserId === user.id);
    uploadsRemaining = meeting.maxUploadsCount - priorSubmissions.length;
  }

  return (
    <main className="container">
      <div className="row justify-content-center">
        <h1>Upload Photos</h1>
        {meeting && uploadsRemaining <= 0 && (
          <p className="text-center">You have already uploaded {meeting.maxUploadsCount} photos for this meeting.</p>
        )}
        {meeting && uploadsRemaining > 0 && (
          <>
            <p className="text-center">
              You may upload up to <b>{uploadsRemaining}</b> more photos for this meeting.
            </p>
            <div className="col-md-6">
              <PhotoUploader meetingId={meetingId} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
export default MeetingUpload;
