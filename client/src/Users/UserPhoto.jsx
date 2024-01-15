import classNames from 'classnames';
import PropTypes from 'prop-types';

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

UserPhoto.propTypes = {
  className: PropTypes.string,
  user: PropTypes.object,
};

export default UserPhoto;
