import { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';
import { Link } from 'react-router-dom';

import Api from './Api';

import './Home.scss';

function Home() {
  const [photos, setPhotos] = useState();

  useEffect(() => {
    Api.photos.random().then((response) => setPhotos(response.data));
  }, []);

  return (
    <main className="container">
      <Masonry
        breakpointCols={{
          default: 4,
          1100: 3,
          700: 2,
          500: 1,
        }}
        className="home-grid"
        columnClassName="home-grid__column">
        {photos?.map((p) => (
          <div key={p.id} className="home-grid__item">
            <Link to={`/members/${p.User.username}/${p.Feature.year}/${p.id}`}>
              <img src={p.largeUrl} alt={p.caption} className="img-fluid" />
            </Link>
          </div>
        ))}
      </Masonry>
    </main>
  );
}

export default Home;
