import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Api from '../Api';
import { useAuthContext } from '../AuthContext';

import './Users.scss';
import UserPhoto from './UserPhoto';

function Users() {
  const { user } = useAuthContext();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    Api.users.index().then((response) => setUsers(response.data));
  }, []);

  return (
    <main className="users container">
      <h1>Members</h1>
      {user?.isAdmin && (
        <div className="mb-5 text-center">
          <Link to="/admin/members" className="btn btn-outline-primary">
            Manage Members
          </Link>
        </div>
      )}
      <div className="row justify-content-center">
        {users.map((user) => (
          <Link key={user.id} to={`/members/${user.username}`} className="users__user col-6 col-md-3 col-lg-2">
            <UserPhoto className="mb-3" user={user} />
            <h4 className="users__name mb-3">
              {user.firstName} {user.lastName}
            </h4>
          </Link>
        ))}
      </div>
    </main>
  );
}
export default Users;
