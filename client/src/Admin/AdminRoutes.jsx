import { Routes, Route } from 'react-router-dom';

import AdminUsersRoutes from './Users/AdminUsersRoutes';

function AdminRoutes() {
  return (
    <Routes>
      <Route path="members/*" element={<AdminUsersRoutes />} />
    </Routes>
  );
}

export default AdminRoutes;
