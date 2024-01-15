import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckSquare, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { DateTime } from 'luxon';
import classNames from 'classnames';

import Api from '../../Api';
import Confirm from '../../Components/Confirm';
import { useAuthContext } from '../../AuthContext';
import { useStaticContext } from '../../StaticContext';

import './AdminUsersList.scss';

function AdminUsersList() {
  const staticContext = useStaticContext();
  const { user: adminUser } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);

  const [selected, setSelected] = useState();
  const [showConfirmRevoke, setConfirmRevoke] = useState(false);
  const [showConfirmResend, setConfirmResend] = useState(false);
  const [showResent, setResent] = useState(false);
  const [showConfirmDeactivate, setConfirmDeactivate] = useState(false);
  const [showConfirmReactivate, setConfirmReactivate] = useState(false);

  useEffect(() => {
    Api.users.index({ showAll: true }).then((response) => setUsers(response.data));
    Api.invites.index().then((response) => setInvites(response.data));
  }, []);

  function userString(user) {
    let name = `${user?.firstName} ${user?.lastName}`.trim();
    return `${name} <${user?.email}>`.trim();
  }

  function showConfirmRevokeModal(invite) {
    setSelected(invite);
    setConfirmRevoke(true);
  }

  async function revoke(invite) {
    setConfirmRevoke(false);
    const response = await Api.invites.revoke(invite.id);
    if (response.status === 200) {
      setInvites(invites.filter((i) => i.id !== invite.id));
    }
  }

  function showConfirmResendModal(invite) {
    setSelected(invite);
    setConfirmResend(true);
  }

  async function resend(invite) {
    setConfirmResend(false);
    const response = await Api.invites.resend(invite.id);
    if (response.status === 200) {
      invite.updatedAt = response.data.updatedAt;
      setInvites([...invites]);
      setResent(true);
    }
  }

  function setConfirmDeactivateModal(user) {
    setSelected(user);
    setConfirmDeactivate(true);
  }

  async function deactivate(user) {
    setConfirmDeactivate(false);
    const response = await Api.users.deactivate(user.id);
    if (response.status === 200) {
      user.deactivatedAt = new Date();
      setUsers([...users]);
    }
  }

  function setConfirmReactivateModal(user) {
    setSelected(user);
    setConfirmReactivate(true);
  }

  async function reactivate(user) {
    setConfirmReactivate(false);
    const response = await Api.users.deactivate(user.id);
    if (response.status === 200) {
      user.deactivatedAt = null;
      setUsers([...users]);
    }
  }

  return (
    <>
      <Helmet>
        <title>Manage Users - {staticContext?.env?.VITE_SITE_TITLE ?? ''}</title>
      </Helmet>
      <main className="users container">
        <h1>Manage Members</h1>
        <div className="mb-5 text-center">
          <Link to="/admin/members/invite" className="btn btn-outline-primary">
            <FontAwesomeIcon icon={faEnvelope} /> Invite a new Member
          </Link>
        </div>
        {invites.length > 0 && (
          <>
            <h2>Invites</h2>
            <div className="table-responsive mb-5">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th className="w-20">First name</th>
                    <th className="w-20">Last name</th>
                    <th className="w-20">Email</th>
                    <th className="w-20">Invited on</th>
                    <th className="w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite) => (
                    <tr key={invite.id}>
                      <td>{invite.firstName}</td>
                      <td>{invite.lastName}</td>
                      <td>
                        <a href={`mailto:${invite.email}`}>{invite.email}</a>
                      </td>
                      <td>{DateTime.fromISO(invite.updatedAt).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-link btn-link--text" onClick={() => showConfirmResendModal(invite)}>
                          Resend&nbsp;Invite
                        </button>
                        &nbsp;|&nbsp;
                        <button className="btn btn-link btn-link--text" onClick={() => showConfirmRevokeModal(invite)}>
                          Revoke&nbsp;Invite
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <h2>Members</h2>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th className="w-20">First name</th>
                <th className="w-20">Last name</th>
                <th className="w-15">Username</th>
                <th className="w-20">Email</th>
                <th className="w-5">Admin?</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={classNames('admin-user', { 'admin-user--deactivated': user.deactivatedAt })}>
                  <td className="admin-user__first-name">{user.firstName}</td>
                  <td className="admin-user__last-name">{user.lastName}</td>
                  <td className="admin-user__username">
                    <Link to={`/members/${user.username}`}>{user.username}</Link>
                  </td>
                  <td className="admin-user__email">
                    <a href={`mailto:${user.email}`}>{user.email}</a>
                  </td>
                  <td>{user.isAdmin && <FontAwesomeIcon icon={faCheckSquare} />}</td>
                  <td>
                    <Link to={`${user.username}`}>Edit&nbsp;Profile</Link>&nbsp;|&nbsp;
                    {!user.deactivatedAt && user.id !== adminUser.id && (
                      <button onClick={() => setConfirmDeactivateModal(user)} className="btn btn-link btn-link--text">
                        Deactivate
                      </button>
                    )}
                    {user.deactivatedAt && (
                      <button onClick={() => setConfirmReactivateModal(user)} className="btn btn-link btn-link--text">
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Confirm
          isShowing={showConfirmResend}
          onHide={() => setConfirmResend(false)}
          onConfirm={() => resend(selected)}
          title="Are you sure?"
          cancelLabel="Cancel"
          primaryLabel="OK">
          <p>
            Are you sure you wish to <b>resend</b> the invite to:
          </p>
          <p>
            <b>{userString(selected)}</b>
          </p>
        </Confirm>
        <Confirm
          isShowing={showResent}
          onHide={() => setResent(false)}
          onConfirm={() => setResent(false)}
          title="Invite resent!"
          primaryLabel="OK">
          <p>The invite has been resent to:</p>
          <p>
            <b>{userString(selected)}</b>
          </p>
        </Confirm>
        <Confirm
          isShowing={showConfirmRevoke}
          onHide={() => setConfirmRevoke(false)}
          onConfirm={() => revoke(selected)}
          title="Are you sure?"
          cancelLabel="Cancel"
          dangerLabel="Revoke">
          <p>
            Are you sure you wish to <b>revoke</b> the invite to:
          </p>
          <p>
            <b>{userString(selected)}</b>
          </p>
        </Confirm>
        <Confirm
          isShowing={showConfirmDeactivate}
          onHide={() => setConfirmDeactivate(false)}
          onConfirm={() => deactivate(selected)}
          title="Are you sure?"
          cancelLabel="Cancel"
          dangerLabel="Deactivate">
          <p>
            Are you sure you wish to <b>deactivate</b>:
          </p>
          <p>
            <b>{userString(selected)}</b>
          </p>
        </Confirm>
        <Confirm
          isShowing={showConfirmReactivate}
          onHide={() => setConfirmReactivate(false)}
          onConfirm={() => reactivate(selected)}
          title="Are you sure?"
          cancelLabel="Cancel"
          primaryLabel="Reactivate">
          <p>
            Are you sure you wish to <b>reactivate</b>:
          </p>
          <p>
            <b>{userString(selected)}</b>
          </p>
        </Confirm>
      </main>
    </>
  );
}
export default AdminUsersList;
