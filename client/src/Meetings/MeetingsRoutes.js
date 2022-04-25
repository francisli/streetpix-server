import { useRouteMatch, Switch } from 'react-router-dom';
import { AuthProtectedRoute } from '../AuthContext';

import Meeting from './Meeting';
import Meetings from './Meetings';
import MeetingForm from './MeetingForm';
import MeetingUpload from './MeetingUpload';

function MeetingsRoutes() {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <AuthProtectedRoute exact path={`${path}/new`}>
        <MeetingForm />
      </AuthProtectedRoute>
      <AuthProtectedRoute exact path={`${path}/templates/:meetingId/edit`}>
        <MeetingForm isTemplate={true} />
      </AuthProtectedRoute>
      <AuthProtectedRoute exact path={`${path}/:meetingId/edit`}>
        <MeetingForm />
      </AuthProtectedRoute>
      <AuthProtectedRoute exact path={`${path}/:meetingId/upload`}>
        <MeetingUpload />
      </AuthProtectedRoute>
      <AuthProtectedRoute exact path={`${path}/:meetingId/:photoId?`}>
        <Meeting />
      </AuthProtectedRoute>
      <AuthProtectedRoute exact path={path}>
        <Meetings />
      </AuthProtectedRoute>
    </Switch>
  );
}

export default MeetingsRoutes;
