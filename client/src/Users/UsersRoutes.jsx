import { Route, Routes } from 'react-router-dom';

import { useAuthContext } from '../AuthContext';

import User from './User';
import Users from './Users';
import UserForm from './UserForm';

function UsersRoutes() {
  const { user } = useAuthContext();

  return (
    <Routes>
      <Route path={`${user?.username}/edit`} element={<UserForm userId={user?.id} />} />
      <Route path=":userId/:year" element={<User />}>
        <Route path=":photoId" element={<></>} />
        <Route path="" element={<></>} />
      </Route>
      <Route path="" element={<Users />} />
    </Routes>
  );
}

export default UsersRoutes;
