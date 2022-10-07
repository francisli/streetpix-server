import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-regular-svg-icons';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';

import './PhotoRating.scss';

function PhotoRating({ onChange, value }) {
  const [newValue, setNewValue] = useState(null);

  function onMouseEnter(starValue) {
    if (value === starValue) {
      setNewValue(0);
    } else {
      setNewValue(starValue);
    }
  }

  function onMouseLeave() {
    setNewValue(null);
  }

  function onClick() {
    if (onChange) {
      onChange(newValue);
    }
  }

  return (
    <span className="photorating">
      <span onMouseEnter={() => onMouseEnter(1)} onMouseLeave={onMouseLeave} onClick={onClick}>
        <FontAwesomeIcon icon={(newValue ?? value ?? 0) >= 1 ? faStarSolid : faStar} />
      </span>
      &nbsp;
      <span onMouseEnter={() => onMouseEnter(2)} onMouseLeave={onMouseLeave} onClick={onClick}>
        <FontAwesomeIcon icon={(newValue ?? value ?? 0) >= 2 ? faStarSolid : faStar} />
      </span>
      &nbsp;
      <span onMouseEnter={() => onMouseEnter(3)} onMouseLeave={onMouseLeave} onClick={onClick}>
        <FontAwesomeIcon icon={(newValue ?? value ?? 0) >= 3 ? faStarSolid : faStar} />
      </span>
      &nbsp;
      <span onMouseEnter={() => onMouseEnter(4)} onMouseLeave={onMouseLeave} onClick={onClick}>
        <FontAwesomeIcon icon={(newValue ?? value ?? 0) >= 4 ? faStarSolid : faStar} />
      </span>
      &nbsp;
      <span onMouseEnter={() => onMouseEnter(5)} onMouseLeave={onMouseLeave} onClick={onClick}>
        <FontAwesomeIcon icon={(newValue ?? value ?? 0) >= 5 ? faStarSolid : faStar} />
      </span>
    </span>
  );
}
export default PhotoRating;
