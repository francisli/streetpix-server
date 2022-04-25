import { useRouteMatch, Switch, Redirect } from 'react-router-dom';
import { AuthProtectedRoute } from '../AuthContext';

import AdminUsersRoutes from './Users/AdminUsersRoutes';

function AdminRoutes() {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <AuthProtectedRoute path={`${path}/members`}>
        <AdminUsersRoutes />
      </AuthProtectedRoute>
      <AuthProtectedRoute exact path={path}>
        <Redirect to={`${path}/members`} />
      </AuthProtectedRoute>
    </Switch>
  );
}

export default AdminRoutes;
