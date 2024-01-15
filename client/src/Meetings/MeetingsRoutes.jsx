import { Routes, Route } from 'react-router-dom';

import Meeting from './Meeting';
import Meetings from './Meetings';
import MeetingForm from './MeetingForm';
import MeetingUpload from './MeetingUpload';

function MeetingsRoutes() {
  return (
    <Routes>
      <Route path="new" element={<MeetingForm />} />
      <Route path="templates/:meetingId/edit" element={<MeetingForm isTemplate={true} />} />
      <Route path=":meetingId/edit" element={<MeetingForm />} />
      <Route path=":meetingId/upload" element={<MeetingUpload />} />
      <Route path=":meetingId" element={<Meeting />}>
        <Route path=":photoId" element={<></>} />
        <Route path="" element={<></>} />
      </Route>
      <Route path="" element={<Meetings />} />
    </Routes>
  );
}

export default MeetingsRoutes;
