import { Routes, Route } from 'react-router-dom';
import { AuthProtected } from '../AuthContext';

import Meeting from './Meeting';
import Meetings from './Meetings';
import MeetingForm from './MeetingForm';
import MeetingUpload from './MeetingUpload';

function MeetingsRoutes() {
  return (
    <Routes>
      <Route
        path="new"
        element={
          <AuthProtected isAdminRequired={true}>
            <MeetingForm />
          </AuthProtected>
        }
      />
      <Route
        path="templates/:meetingId/edit"
        element={
          <AuthProtected isAdminRequired={true}>
            <MeetingForm isTemplate={true} />
          </AuthProtected>
        }
      />
      <Route
        path=":meetingId/edit"
        element={
          <AuthProtected isAdminRequired={true}>
            <MeetingForm />
          </AuthProtected>
        }
      />
      <Route
        path=":meetingId/upload"
        element={
          <AuthProtected>
            <MeetingUpload />
          </AuthProtected>
        }
      />
      <Route
        path=":meetingId"
        element={
          <AuthProtected>
            <Meeting />
          </AuthProtected>
        }>
        <Route path=":photoId" element={<></>} />
        <Route path="" element={<></>} />
      </Route>
      <Route
        path=""
        element={
          <AuthProtected>
            <Meetings />
          </AuthProtected>
        }
      />
    </Routes>
  );
}

export default MeetingsRoutes;
