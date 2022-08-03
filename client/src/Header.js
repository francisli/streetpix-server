import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

import './Header.scss';
import Api from './Api';
import { useAuthContext } from './AuthContext';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dismissedKey, setDismissedKey] = useState(null);
  const { user, setUser } = useAuthContext();

  useEffect(
    function () {
      Api.users.me().then((response) => {
        if (response.status === 204) {
          setUser(null);
        } else {
          setUser(response.data);
        }
      });
    },
    [setUser]
  );

  async function onLogout(event) {
    event.preventDefault();
    await Api.auth.logout();
    setUser(null);
    navigate('/');
  }

  return (
    <>
      <nav className="header navbar navbar-expand-md navbar-light bg-light fixed-top">
        <div className="container">
          <Link className="navbar-brand" to="/">
            SF Bay Street Photography
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarsExampleDefault"
            aria-controls="navbarsExampleDefault"
            aria-expanded="false"
            aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarsExampleDefault">
            <ul className="navbar-nav flex-grow-1 mb-2 mb-md-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/members">
                  Members
                </Link>
              </li>
              {user && (
                <li className="nav-item">
                  <Link className="nav-link" to="/meetings">
                    Meetings
                  </Link>
                </li>
              )}
              <div className="flex-grow-1 d-flex justify-content-end">
                {user && (
                  <>
                    <li className="nav-item me-3">
                      <span className="nav-link d-inline-block">
                        Hello, <Link to={`/members/${user.username}`}>{user.firstName}!</Link>
                      </span>
                      {user.pictureUrl && <div className="header__picture" style={{ backgroundImage: `url(${user.pictureUrl})` }}></div>}
                    </li>
                    <li className="nav-item">
                      <a className="nav-link" href="/logout" onClick={onLogout}>
                        Log out
                      </a>
                    </li>
                  </>
                )}
                {!user && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">
                      Log in
                    </Link>
                  </li>
                )}
              </div>
            </ul>
          </div>
        </div>
      </nav>
      {location.state?.flash && dismissedKey !== location.key && (
        <div className="container">
          <div className="alert alert-info alert-dismissible text-center">
            {location.state.flash}
            <button
              onClick={() => setDismissedKey(location.key)}
              type="button"
              className="btn-close"
              data-bs-dismiss="alert"
              aria-label="Close"></button>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
