import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

import Api from './Api';
import { useStaticContext } from './StaticContext';

import './Home.scss';

function Home() {
  const staticContext = useStaticContext();
  const [photos, setPhotos] = useState();

  useEffect(() => {
    Api.photos.random().then((response) => setPhotos(response.data));
  }, []);

  return (
    <>
      <Helmet>
        <title>Home - {staticContext?.env?.VITE_SITE_TITLE ?? ''}</title>
      </Helmet>
      <main className="container">
        <h1 className="my-4">SF Bay Street Photography</h1>
        <div className="row">
          {photos?.map((p) => (
            <div key={p.id} className="thumbnail col-md-6 col-lg-4 col-xl-3">
              <div className="thumbnail__content">
                <Link to={`/members/${p.User.username}/${p.Feature.year}/${p.id}`} className="square mb-3">
                  <div className="square__content" style={{ backgroundImage: `url(${p.thumbUrl})` }}></div>
                </Link>
                <div className="thumbnail__metadata fw-bolder">{p.caption ? p.caption : <>&nbsp;</>}</div>
                <div className="thumbnail__metadata">
                  {p.User.firstName} {p.User.lastName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export default Home;
