import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import License from './Components/License';
import Api from './Api';
import './Home.scss';

function Home() {
  const [photo, setPhoto] = useState();

  useEffect(() => {
    Api.photos.random().then((response) => setPhoto(response.data));
  }, []);

  return (
    <main className="container">
      {photo && (
        <>
          <div className="home__photo mb-3">
            <img src={photo.largeUrl} alt={photo.caption} className="img-fluid" />
          </div>
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="photo__caption">{photo.caption}</div>
              <div className="photo__description">{photo.description}</div>
              <div className="row">
                <div className="col-md-6">
                  <div className="photo__user text-secondary">
                    Taken by:{' '}
                    <Link to={`/members/${photo.User.username}`}>
                      {photo.User?.firstName} {photo.User?.lastName}
                    </Link>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="photo__license text-secondary">
                    License: <License selected={photo.license} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default Home;
