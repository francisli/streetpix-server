import { useEffect, useState } from 'react';
import { useParams, Link, Outlet } from 'react-router-dom';
import classNames from 'classnames';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';

function Resources() {
  const { user } = useAuthContext();
  const { categoryId } = useParams();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Api.resourceCategories.index().then((response) => {
      setCategories(response.data);
    });
  }, []);

  return (
    <main className="container">
      <h1>Resources</h1>
      <div className="row">
        <div className="col-lg-3 col-xl-2 mb-5">
          <div className="list-group">
            {categories.map((category) => (
              <Link
                className={classNames('list-group-item', { active: category.link === categoryId })}
                key={category.id}
                to={`/resources/${category.link}`}>
                {category.name}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link className="list-group-item" to="/resources/categories/new">
                + New Category
              </Link>
            )}
          </div>
        </div>
        <div className="offset-lg-1 col-lg-8 col-xl-9">
          <Outlet />
        </div>
      </div>
    </main>
  );
}

export default Resources;
