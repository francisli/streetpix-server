import { useState } from 'react';
import classNames from 'classnames';
import { StatusCodes } from 'http-status-codes';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import PhotoInput from '../Components/PhotoInput';
import UnexpectedError from '../UnexpectedError';
import ValidationError from '../ValidationError';

function UserForm() {
  const authContext = useAuthContext();

  const [user, setUser] = useState({ ...authContext.user, password: '' });
  const [isUploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function onChange(event) {
    const newUser = { ...user };
    newUser[event.target.name] = event.target.value;
    setUser(newUser);
  }

  function onToggle(event) {
    const newUser = { ...user };
    newUser[event.target.name] = event.target.checked;
    setUser(newUser);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      const response = await Api.users.update(user.id, user);
      authContext.setUser(response.data);
      setSuccess(true);
    } catch (error) {
      if (error.response?.status === StatusCodes.UNPROCESSABLE_ENTITY) {
        setError(new ValidationError(error.response.data));
      } else {
        setError(new UnexpectedError());
      }
    }
    window.scrollTo(0, 0);
  }

  return (
    <main className="container">
      <div className="row justify-content-center">
        <div className="col col-sm-10 col-md-8 col-lg-6 col-xl-4">
          <h1>Edit Profile</h1>
          <form onSubmit={onSubmit} autoComplete="off">
            {error && error.message && <div className="alert alert-danger">{error.message}</div>}
            {success && <div className="alert alert-info">Your account has been updated!</div>}
            <div className="mb-3">
              <label className="form-label" htmlFor="picture">
                Picture
              </label>
              <PhotoInput
                className="card"
                id="picture"
                name="picture"
                value={user.picture}
                valueUrl={user.pictureUrl}
                onChange={onChange}
                onUploading={setUploading}>
                <div className="card-body">
                  <div className="card-text">Drag-and-drop a photo file here, or click here to browse and select a file.</div>
                </div>
              </PhotoInput>
              {error?.errorMessagesHTMLFor?.('picture')}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="firstName">
                First name
              </label>
              <input
                type="text"
                className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('firstName') })}
                id="firstName"
                name="firstName"
                onChange={onChange}
                value={user.firstName ?? ''}
              />
              {error?.errorMessagesHTMLFor?.('firstName')}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="lastName">
                Last name
              </label>
              <input
                type="text"
                className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('lastName') })}
                id="lastName"
                name="lastName"
                onChange={onChange}
                value={user.lastName ?? ''}
              />
              {error?.errorMessagesHTMLFor?.('lastName')}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                type="text"
                data-lpignore="true"
                className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('username') })}
                id="username"
                name="username"
                onChange={onChange}
                value={user.username ?? ''}
              />
              {error?.errorMessagesHTMLFor?.('username')}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                type="text"
                data-lpignore="true"
                className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('email') })}
                id="email"
                name="email"
                onChange={onChange}
                value={user.email ?? ''}
              />
              {error?.errorMessagesHTMLFor?.('email')}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="phone">
                Phone
              </label>
              <input
                type="tel"
                className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('phone') })}
                id="phone"
                name="phone"
                onChange={onChange}
                value={user.phone ?? ''}
              />
              {error?.errorMessagesHTMLFor?.('phone')}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                data-lpignore="true"
                className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('password') })}
                id="password"
                name="password"
                onChange={onChange}
                value={user.password ?? ''}
              />
              {error?.errorMessagesHTMLFor?.('password')}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="bio">
                Bio
              </label>
              <textarea
                className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('bio') })}
                id="bio"
                name="bio"
                onChange={onChange}
                value={user.bio ?? ''}
              />
              {error?.errorMessagesHTMLFor?.('bio')}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="website">
                Website
              </label>
              <input
                type="text"
                className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('website') })}
                id="website"
                name="website"
                onChange={onChange}
                value={user.website ?? ''}
              />
              {error?.errorMessagesHTMLFor?.('website')}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="isPublic">
                Profile Visibility
              </label>
              <div className="form-check">
                <input
                  type="checkbox"
                  className={classNames('form-check-input', { 'is-invalid': error?.errorsFor?.('isPublic') })}
                  id="isPublic"
                  name="isPublic"
                  onChange={onToggle}
                  checked={user.isPublic}
                />
                <label htmlFor="isPublic" className="form-check-label">
                  Is visible to the public?
                </label>
              </div>
              {error?.errorMessagesHTMLFor?.('isPublic')}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="license">
                Default License
              </label>
              <select
                className={classNames('form-select', { 'is-invalid': error?.errorsFor?.('license') })}
                id="license"
                name="license"
                onChange={onChange}
                value={user.license ?? ''}>
                <option value="allrightsreserved">All Rights Reserved</option>
                <option value="ccby">CC BY</option>
                <option value="ccbysa">CC BY-SA</option>
                <option value="ccbync">CC BY-NC</option>
                <option value="ccbyncsa">CC BY-NC-SA</option>
                <option value="ccbynd">CC BY-ND</option>
                <option value="publicdomain">Public Domain</option>
              </select>
              {error?.errorMessagesHTMLFor?.('license')}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="acquireLicensePage">
                Default Licensing Link
              </label>
              <input
                type="text"
                className={classNames('form-control', { 'is-invalid': error?.errorsFor?.('acquireLicensePage') })}
                id="acquireLicensePage"
                name="acquireLicensePage"
                onChange={onChange}
                value={user.acquireLicensePage ?? ''}
              />
              {error?.errorMessagesHTMLFor?.('acquireLicensePage')}
            </div>
            <div className="mb-3 d-grid">
              <button disabled={isUploading} className="btn btn-primary" type="submit">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default UserForm;
