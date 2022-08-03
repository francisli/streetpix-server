import { Route, Routes } from 'react-router-dom';
import { useAuthContext, AuthProtected } from '../AuthContext';

import User from './User';
import Users from './Users';
import UserForm from './UserForm';

function UserRoutes() {
  const { user } = useAuthContext();

  return (
    <Routes>
      <Route path={`${user?.username}/edit`} element={<AuthProtected>{user && <UserForm userId={user.id} />}</AuthProtected>} />
      <Route path=":userId" element={<User />}>
        <Route path=":photoId" element={<></>} />
        <Route path="" element={<></>} />
      </Route>
      <Route path="" element={<Users />} />
    </Routes>
  );
}

export default UserRoutes;
