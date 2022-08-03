import { Navigate, Routes, Route } from 'react-router-dom';
import { AuthProtected } from '../AuthContext';

import AdminUsersRoutes from './Users/AdminUsersRoutes';

function AdminRoutes() {
  return (
    <Routes>
      <Route
        path="members/*"
        element={
          <AuthProtected>
            <AdminUsersRoutes />
          </AuthProtected>
        }
      />
      <Route
        path=""
        element={
          <AuthProtected>
            <Navigate to="members" />
          </AuthProtected>
        }
      />
    </Routes>
  );
}

export default AdminRoutes;
