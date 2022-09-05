import { useEffect, useState } from 'react';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';

function PhotoForm({ id, filename, file, meetingId, onCancel, onUpdated, onDeleted }) {
  const { user } = useAuthContext();
  const [data, setData] = useState({
    filename,
    file,
    license: user?.license,
    acquireLicensePage: user?.acquireLicensePage,
  });
  const [isLoading, setLoading] = useState(false);
  const [isCreated, setCreated] = useState(false);
  const [isUpdated, setUpdated] = useState(false);

  useEffect(() => {
    if (id) {
      Api.photos.get(id).then((response) => setData(response.data));
    }
  }, [id]);

  function onChange(event) {
    const newData = { ...data };
    newData[event.target.name] = event.target.value;
    setData(newData);
    setUpdated(false);
    setCreated(false);
  }

  function onChangeCheckbox(event) {
    const newData = { ...data };
    newData[event.target.name] = event.target.checked;
    setData(newData);
    setUpdated(false);
    setCreated(false);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setCreated(false);
    setUpdated(false);
    try {
      let response;
      if (data.id) {
        response = await Api.photos.update(data.id, data);
      } else if (meetingId) {
        response = await Api.meetings.submit(meetingId, data);
        response.data = response.data.Photo;
      } else {
        response = await Api.photos.create(data);
      }
      setLoading(false);
      setData(response.data);
      if (data.id) {
        setUpdated(true);
        onUpdated?.(response.data);
      } else {
        setCreated(true);
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
    return false;
  }

  async function onDelete(event) {
    event.preventDefault();
    if (window.confirm('Are you sure you wish to delete this photo?')) {
      try {
        setLoading(true);
        await Api.photos.delete(id);
        if (onDeleted) {
          onDeleted();
        }
      } catch (error) {
        setLoading(false);
        console.log(error);
      }
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <fieldset disabled={isLoading}>
        <div className="mb-3">
          <label htmlFor="filename" className="form-label">
            Original File Name
          </label>
          <input id="filename" name="filename" value={data?.filename ?? ''} readOnly={true} type="text" className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="caption" className="form-label">
            Caption
          </label>
          <input id="caption" name="caption" value={data?.caption ?? ''} onChange={onChange} type="text" className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea id="description" name="description" value={data?.description ?? ''} onChange={onChange} className="form-control" />
        </div>
        <div className="mb-3">
          <label htmlFor="license" className="form-label">
            License
          </label>
          <select className="form-select" id="license" name="license" onChange={onChange} value={data.license ?? ''}>
            <option value="allrightsreserved">All Rights Reserved</option>
            <option value="ccby">CC BY</option>
            <option value="ccbysa">CC BY-SA</option>
            <option value="ccbync">CC BY-NC</option>
            <option value="ccbyncsa">CC BY-NC-SA</option>
            <option value="ccbynd">CC BY-ND</option>
            <option value="publicdomain">Public Domain</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="acquireLicensePage" className="form-label">
            Licensing Page
          </label>
          <input
            id="acquireLicensePage"
            name="acquireLicensePage"
            value={data?.acquireLicensePage ?? ''}
            onChange={onChange}
            type="text"
            className="form-control"
          />
        </div>
        <div className="d-flex justify-content-between">
          <div>
            <button className="btn btn-outline-primary" type="submit">
              {data.id ? 'Update' : 'Submit'}
            </button>
            {onCancel && (
              <>
                &nbsp;&nbsp;
                <button onClick={onCancel} className="btn btn-outline-secondary" type="button">
                  Cancel
                </button>
              </>
            )}
            &nbsp;&nbsp;
            {isCreated && <span className="text-success">Photo added!</span>}
            {isUpdated && <span className="text-success">Photo updated!</span>}
          </div>
          {id && (
            <button onClick={onDelete} className="btn btn-outline-danger" type="button">
              Delete
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
export default PhotoForm;
