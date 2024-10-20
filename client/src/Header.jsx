import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import classNames from 'classnames';

import UserPhoto from './Users/UserPhoto';
import './Header.scss';
import Api from './Api';
import { useAuthContext } from './AuthContext';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dismissedKey, setDismissedKey] = useState(null);
  const [isNavbarShowing, setNavbarShowing] = useState(false);
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
    hideNavbar();
    navigate('/');
  }

  function toggleNavbar() {
    setNavbarShowing(!isNavbarShowing);
  }

  function hideNavbar() {
    setNavbarShowing(false);
  }

  return (
    <>
      <nav className="header navbar navbar-expand-lg navbar-light bg-light fixed-top">
        <div className="container">
          <Link className="navbar-brand" to="/" onClick={hideNavbar}>
            SF Bay Street Photography
          </Link>
          <button onClick={toggleNavbar} className="navbar-toggler" type="button" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={classNames('collapse navbar-collapse', { show: isNavbarShowing })}>
            <ul className="navbar-nav flex-grow-1 mb-2 mb-md-0">
              <li className="nav-item">
                <Link className="nav-link" to="/" onClick={hideNavbar}>
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/members" onClick={hideNavbar}>
                  Members
                </Link>
              </li>
              {user && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/meetings" onClick={hideNavbar}>
                      Meetings
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/browse" onClick={hideNavbar}>
                      Browse
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/comments" onClick={hideNavbar}>
                      Comments
                    </Link>
                  </li>
                </>
              )}
              <div className="flex-grow-1 d-lg-flex text-end justify-content-end">
                {user && (
                  <>
                    <li className="nav-item me-lg-3">
                      <span className="nav-link d-inline-block me-2 me-lg-0">
                        Hello,{' '}
                        <Link to={`/members/${user.username}`} onClick={hideNavbar}>
                          {user.firstName}!
                        </Link>
                      </span>
                      <UserPhoto className="header__picture" user={user} />
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
                    <Link className="nav-link" to="/login" onClick={hideNavbar}>
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
