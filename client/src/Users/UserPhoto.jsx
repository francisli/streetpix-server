import classNames from 'classnames';

import './UserPhoto.scss';

function UserPhoto({ className, user }) {
  return (
    <div className={classNames('user-photo square', className)}>
      <div
        className="user-photo__photo square__content"
        style={{ backgroundImage: user.picture ? `url(${user.pictureThumbUrl})` : 'none' }}></div>
    </div>
  );
}

export default UserPhoto;
