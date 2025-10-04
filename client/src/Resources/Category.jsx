import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import ExternalLink from '../Components/ExternalLink';

function Category() {
  const { user } = useAuthContext();
  const { categoryId } = useParams();
  const [category, setCategory] = useState();
  const [resources, setResources] = useState([]);

  useEffect(() => {
    Api.resourceCategories.get(categoryId).then((response) => {
      setCategory(response.data);
    });
  }, [categoryId]);

  useEffect(() => {
    Api.resources.index({ categoryId }).then((response) => {
      setResources(response.data);
    });
  }, [categoryId]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">{category?.name}</h3>
        {user?.isAdmin && (
          <Link className="btn btn-outline-primary" to="new">
            + New Resource
          </Link>
        )}
      </div>
      <div className="row">
        {resources.map((resource) => (
          <div className="col col-12 col-sm-10 col-md-8 col-lg-6 col-xl-4 mb-3" key={resource.id}>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{resource.name}</h5>
                <p className="card-text">
                  {resource.desc}
                  <br />
                  {resource.url && <ExternalLink href={resource.url} />}
                  {resource.file && <ExternalLink href={resource.fileURL}>{resource.fileName ?? resource.file}</ExternalLink>}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Category;
