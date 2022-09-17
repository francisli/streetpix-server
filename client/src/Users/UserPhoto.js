import './UserPhoto.scss';

function UserPhoto({ user }) {
  return (
    <div className="user-photo square mb-3">
      <div
        className="user-photo__photo square__content"
        style={{ backgroundImage: user.picture ? `url(${user.pictureUrl})` : 'none' }}></div>
    </div>
  );
}
export default UserPhoto;
