import { useState } from 'react';
import classNames from 'classnames';
import ValidationError from '../ValidationError';
import { useNavigate } from 'react-router-dom';
import Api from '../Api';

function CategoryForm() {
  const navigate = useNavigate();
  const [category, setCategory] = useState({
    name: '',
    link: '',
    position: 0,
  });
  const [error, setError] = useState({});

  function onChange(event) {
    const { name, value } = event.target;
    setCategory({ ...category, [name]: value });
  }

  async function onSubmit(event) {
    event.preventDefault();
    try {
      await Api.resourceCategories.create(category);
      navigate('/resources');
    } catch (error) {
      setError(new ValidationError(error.response.data));
    }
    window.scrollTo(0, 0);
  }

  return (
    <div className="row">
      <form onSubmit={onSubmit} className="col col-sm-10 col-md-8 col-lg-6 col-xl-4">
        <fieldset>
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
              value={category.name ?? ''}
            />
            {error?.errorMessagesHTMLFor?.('name')}
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="link">
              Link
            </label>
            <input
              type="text"
              className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('link') })}
              id="link"
              name="link"
              onChange={onChange}
              value={category.link ?? ''}
            />
            {error?.errorMessagesHTMLFor?.('link')}
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="position">
              Position
            </label>
            <input
              type="number"
              className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('position') })}
              id="position"
              name="position"
              onChange={onChange}
              value={category.position ?? 0}
            />
            {error?.errorMessagesHTMLFor?.('position')}
          </div>
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

export default CategoryForm;
