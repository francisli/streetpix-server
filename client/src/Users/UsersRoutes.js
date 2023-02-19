import { Navigate, Route, Routes } from 'react-router-dom';
import { DateTime } from 'luxon';

import { useAuthContext, AuthProtected } from '../AuthContext';

import User from './User';
import Users from './Users';
import UserForm from './UserForm';

function UserRoutes() {
  const { user } = useAuthContext();
  const year = DateTime.now().year - 1;

  return (
    <Routes>
      <Route path={`${user?.username}/edit`} element={<AuthProtected>{user && <UserForm userId={user.id} />}</AuthProtected>} />
      <Route path=":userId/:year" element={<User />}>
        <Route path=":photoId" element={<></>} />
        <Route path="" element={<></>} />
      </Route>
      <Route path=":userId" element={<Navigate to={`${user ? 'all' : year}`} replace />} />
      <Route path="" element={<Users />} />
    </Routes>
  );
}

export default UserRoutes;
