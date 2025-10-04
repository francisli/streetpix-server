import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames';

import Api from '../Api';
import ValidationError from '../ValidationError';
import FormFileGroup from '../Components/FormFileGroup';

function ResourceForm() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [CategoryId, setCategoryId] = useState();
  const [isLoading, setLoading] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [resource, setResource] = useState({
    CategoryId: '',
    name: '',
    desc: '',
    url: '',
    file: '',
  });
  const [error, setError] = useState({});

  useEffect(() => {
    Api.resourceCategories.get(categoryId).then((response) => {
      setCategoryId(response.data.id);
    });
  }, [categoryId]);

  function onChange(event) {
    const { name, value } = event.target;
    setResource({ ...resource, [name]: value });
  }

  function onChangeFile(newFile) {
    const { file, fileURL, fileName } = newFile;
    setResource({ ...resource, file, fileURL, fileName });
    setUploading(false);
  }

  async function onSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      await Api.resources.create({ ...resource, CategoryId });
      navigate('/resources');
    } catch (error) {
      setError(new ValidationError(error.response.data));
    }
    setLoading(false);
    window.scrollTo(0, 0);
  }

  return (
    <div className="row">
      <form onSubmit={onSubmit} className="col col-sm-10 col-md-8 col-lg-6 col-xl-6">
        <fieldset disabled={isLoading || isUploading}>
          <div className="mb-3">
            <label className="form-label" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('name') })}
              id="name"
              name="name"
              onChange={onChange}
              value={resource.name ?? ''}
            />
            {error?.errorMessagesHTMLFor?.('name')}
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="desc">
              Description
            </label>
            <textarea
              className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('desc') })}
              id="desc"
              name="desc"
              onChange={onChange}
              value={resource.desc ?? ''}
              rows={3}
            />
            {error?.errorMessagesHTMLFor?.('desc')}
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="url">
              URL
            </label>
            <input
              type="text"
              className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('url') })}
              id="url"
              name="url"
              onChange={onChange}
              value={resource.url ?? ''}
            />
            {error?.errorMessagesHTMLFor?.('url')}
          </div>
          <FormFileGroup id="file" label="File" file={resource} onUploading={setUploading} onChangeFile={onChangeFile} />
          <div className="mb-3 d-grid">
            <button className="btn btn-primary" type="submit">
              Submit
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}

export default ResourceForm;
