import { useRouteMatch, Route, Switch } from 'react-router-dom';
import { useAuthContext, AuthProtectedRoute } from '../AuthContext';

import User from './User';
import Users from './Users';
import UserForm from './UserForm';
import UserUpload from './UserUpload';

function UserRoutes() {
  const { user } = useAuthContext();
  const { path } = useRouteMatch();

  return (
    <Switch>
      <AuthProtectedRoute exact path={`${path}/${user?.username}/edit`}>
        {user && <UserForm userId={user.id} />}
      </AuthProtectedRoute>
      <AuthProtectedRoute exact path={`${path}/${user?.username}/upload`}>
        {user && <UserUpload />}
      </AuthProtectedRoute>
      <Route path={`${path}/:userId/:photoId?`} render={({ match }) => <User userId={match.params.userId} />} />
      <Route exact path={path}>
        <Users />
      </Route>
    </Switch>
  );
}

export default UserRoutes;
