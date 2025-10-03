import { Route, Routes } from 'react-router-dom';

import Resources from './Resources';

function ResourcesRoutes() {
  return (
    <Routes>
      <Route path="" element={<Resources />} />
    </Routes>
  );
}

export default ResourcesRoutes;
