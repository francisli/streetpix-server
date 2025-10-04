import { Route, Routes } from 'react-router-dom';

import Category from './Category';
import CategoryForm from './Categories/CategoryForm';
import Resources from './Resources';
import ResourceForm from './ResourceForm';

function ResourcesRoutes() {
  return (
    <Routes>
      <Route path="" element={<Resources />}>
        <Route path=":categoryId/new" element={<ResourceForm />} />
        <Route path=":categoryId" element={<Category />} />
        <Route path="categories/new" element={<CategoryForm />} />
      </Route>
    </Routes>
  );
}

export default ResourcesRoutes;
