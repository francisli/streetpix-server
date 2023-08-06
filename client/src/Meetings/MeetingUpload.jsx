import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DateTime } from 'luxon';

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
        <div className="row">
          <div className="col-lg-3 mb-5">
            <dl>
              <dt>Meeting Date/Time</dt>
              <dd>{meeting && DateTime.fromISO(meeting.startsAt).toFormat("cccc, LLLL d, yyyy 'at' h:mm a")}</dd>
              <dt className="mt-3">
                <Link to={`/meetings/${meetingId}`} className="btn btn-outline-primary me-3 mb-3">
                  &lArr; Back to Meeting
                </Link>
              </dt>
            </dl>
          </div>
          <div className="col-lg-6">
            {meeting && uploadsRemaining <= 0 && (
              <p className="text-center">You have already uploaded {meeting.maxUploadsCount} photos for this meeting.</p>
            )}
            {meeting && uploadsRemaining > 0 && (
              <>
                <p className="text-center">
                  You may upload up to <b>{uploadsRemaining}</b> more photos for this meeting.
                  <br />
                  <br />
                  <em>Important:</em> Do not close or navigate away from this page until all the "Please wait..." messages are replaced with
                  a photo detail editing form.
                </p>
                <PhotoUploader meetingId={meetingId} maxFiles={uploadsRemaining} />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
export default MeetingUpload;
