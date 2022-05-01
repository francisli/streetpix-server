import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckSquare, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { DateTime } from 'luxon';

import Api from '../../Api';

function AdminUsersList() {
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    Api.users.index().then((response) => setUsers(response.data));
    Api.invites.index().then((response) => setInvites(response.data));
  }, []);

  async function revoke(invite) {
    let name = `${invite.firstName} ${invite.lastName}`.trim();
    let nameAndEmail = `${name} <${invite.email}>`.trim();
    if (window.confirm(`Are you sure you wish to revoke the invite to ${nameAndEmail}?`)) {
      const response = await Api.invites.revoke(invite.id);
      if (response.status === 200) {
        setInvites(invites.filter((i) => i.id !== invite.id));
      }
    }
  }

  return (
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
                    <td>{DateTime.fromISO(invite.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-link p-0" onClick={() => revoke(invite)}>
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
              <th className="w-20">Username</th>
              <th className="w-20">Email</th>
              <th className="w-5">Admin?</th>
              <th className="w-15">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>
                  <Link to={`/members/${user.username}`}>{user.username}</Link>
                </td>
                <td>
                  <a href={`mailto:${user.email}`}>{user.email}</a>
                </td>
                <td>{user.isAdmin && <FontAwesomeIcon icon={faCheckSquare} />}</td>
                <td>
                  <Link to={`/admin/members/${user.username}`}>Edit&nbsp;Profile</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
export default AdminUsersList;