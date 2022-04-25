import { useRouteMatch, Switch } from 'react-router-dom';
import { AuthProtectedRoute } from '../../AuthContext';

import AdminUserInvite from './AdminUserInvite';
import AdminUsersList from './AdminUsersList';
import UserForm from '../../Users/UserForm';

function AdminUsersRoutes() {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <AuthProtectedRoute isAdminRequired={true} path={`${path}/invite`}>
        <AdminUserInvite />
      </AuthProtectedRoute>
      <AuthProtectedRoute
        isAdminRequired={true}
        path={`${path}/:userId`}
        render={({ match }) => <UserForm userId={match.params.userId} />}
      />
      <AuthProtectedRoute isAdminRequired={true} exact path={path}>
        <AdminUsersList />
      </AuthProtectedRoute>
    </Switch>
  );
}

export default AdminUsersRoutes;
