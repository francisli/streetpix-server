import { Routes, Route } from 'react-router-dom';
import { AuthProtected } from '../../AuthContext';

import AdminUserInvite from './AdminUserInvite';
import AdminUsersList from './AdminUsersList';
import UserForm from '../../Users/UserForm';

function AdminUsersRoutes() {
  return (
    <Routes>
      <Route
        path="invite"
        element={
          <AuthProtected isAdminRequired={true}>
            <AdminUserInvite />
          </AuthProtected>
        }
      />
      <Route
        path=":userId"
        render={({ match }) => (
          <AuthProtected isAdminRequired={true}>
            <UserForm userId={match.params.userId} />
          </AuthProtected>
        )}
      />
      <Route
        path=""
        element={
          <AuthProtected isAdminRequired={true}>
            <AdminUsersList />
          </AuthProtected>
        }
      />
    </Routes>
  );
}

export default AdminUsersRoutes;
