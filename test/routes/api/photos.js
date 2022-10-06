const assert = require('assert');
const fs = require('fs-extra');
const HttpStatus = require('http-status-codes');
const path = require('path');
const session = require('supertest-session');

const helper = require('../../helper');
const app = require('../../../app');
const models = require('../../../models');

describe('/api/photos', () => {
  let testSession;

  beforeEach(async () => {
    await helper.loadUploads([
      ['512x512.png', 'e6ecab76-48ca-4a89-8593-281153dff454.jpg'],
      ['512x512.png', 'ea92aaca-4fa3-4ff7-96e9-dd0db71b5143.jpg'],
      ['512x512.png', 'd0cb02d1-e95f-4d05-8b90-f2db36357e83.jpg'],
      ['512x512.png', '719a0396-782e-4edc-934c-72a23689f89f.jpg'],
    ]);
    await helper.loadFixtures(['users', 'photos', 'features']);
    testSession = session(app);
  });

  afterEach(async () => {
    fs.removeSync(path.resolve(__dirname, '../../../public/assets', process.env.ASSET_PATH_PREFIX));
  });

  context('unauthenticated', () => {
    describe('GET /', () => {
      it('returns all public photos', async () => {
        /// request photos
        const response = await testSession.get('/api/photos').set('Accept', 'application/json').expect(HttpStatus.OK);
        assert.deepStrictEqual(response.body?.length, 3);

        const docs = response.body;
        assert.deepStrictEqual(docs[0].caption, 'Test photo 4');
        assert.deepStrictEqual(docs[1].caption, 'Test photo 3');
        assert.deepStrictEqual(docs[2].caption, 'Test photo 2');
      });

      it('returns all public photos for a user', async () => {
        /// request photos
        const response = await testSession.get('/api/photos?userId=1').set('Accept', 'application/json').expect(HttpStatus.OK);
        assert.deepStrictEqual(response.body?.length, 1);

        const docs = response.body;
        assert.deepStrictEqual(docs[0].caption, 'Test photo 2');
      });

      it('returns all public photos for a user by username', async () => {
        /// request photos
        const response = await testSession.get('/api/photos?userId=admin1').set('Accept', 'application/json').expect(HttpStatus.OK);
        assert.deepStrictEqual(response.body?.length, 1);

        const docs = response.body;
        assert.deepStrictEqual(docs[0].caption, 'Test photo 2');
      });

      it('returns all public photos for a user for a given year', async () => {
        /// request photos
        const response = await testSession.get('/api/photos?userId=2&year=2021').set('Accept', 'application/json').expect(HttpStatus.OK);
        assert.deepStrictEqual(response.body?.length, 1);

        const docs = response.body;
        assert.deepStrictEqual(docs[0].caption, 'Test photo 4');
      });
    });
  });

  context('authenticated', () => {
    beforeEach(async () => {
      await testSession
        .post('/api/auth/login')
        .set('Accept', 'application/json')
        .send({ email: 'regular.user@test.com', password: 'abcd1234' })
        .expect(HttpStatus.OK);
    });

    describe('GET /', () => {
      it('returns all photos', async () => {
        /// request photos
        const response = await testSession.get('/api/photos').set('Accept', 'application/json').expect(HttpStatus.OK);
        assert.deepStrictEqual(response.body?.length, 4);

        const docs = response.body;
        assert.deepStrictEqual(docs[0].caption, 'Test photo 4');
        assert.deepStrictEqual(docs[1].caption, 'Test photo 3');
        assert.deepStrictEqual(docs[2].caption, 'Test photo 2');
        assert.deepStrictEqual(docs[3].caption, 'Test photo 1');
      });

      it('returns all photos for a user', async () => {
        /// request photos
        const response = await testSession.get('/api/photos?userId=1').set('Accept', 'application/json').expect(HttpStatus.OK);
        assert.deepStrictEqual(response.body?.length, 2);

        const docs = response.body;
        assert.deepStrictEqual(docs[0].caption, 'Test photo 2');
        assert.deepStrictEqual(docs[1].caption, 'Test photo 1');
      });

      it('returns all photos for a user by username', async () => {
        /// request photos
        const response = await testSession.get('/api/photos?userId=admin1').set('Accept', 'application/json').expect(HttpStatus.OK);
        assert.deepStrictEqual(response.body?.length, 2);

        const docs = response.body;
        assert.deepStrictEqual(docs[0].caption, 'Test photo 2');
        assert.deepStrictEqual(docs[1].caption, 'Test photo 1');
      });
    });

    describe('POST /', () => {
      it('creates a new photo for the user', async () => {
        await helper.loadUploads([['512x512.png', '227d54fe-6abf-4130-a75e-3cc90d92dcb6.jpg']]);
        const response = await testSession
          .post('/api/photos')
          .set('Accept', 'application/json')
          .send({
            file: '227d54fe-6abf-4130-a75e-3cc90d92dcb6.jpg',
            caption: 'This is a test caption',
            description: 'This is a test description',
          })
          .expect(HttpStatus.CREATED);

        const doc = response.body;
        const record = await models.Photo.findByPk(doc.id);
        assert(record);
        assert.deepStrictEqual(record.file, '227d54fe-6abf-4130-a75e-3cc90d92dcb6.jpg');
        assert(
          fs.pathExistsSync(
            path.resolve(
              __dirname,
              '../../../public/assets',
              process.env.ASSET_PATH_PREFIX,
              'photos',
              record.id,
              'file',
              '227d54fe-6abf-4130-a75e-3cc90d92dcb6.jpg'
            )
          )
        );
        assert.deepStrictEqual(record.caption, 'This is a test caption');
        assert.deepStrictEqual(record.description, 'This is a test description');
      });
    });

    describe('PATCH /:id', () => {
      it('updates an existing photo', async () => {
        await testSession
          .patch('/api/photos/d0cb02d1-e95f-4d05-8b90-f2db36357e83')
          .set('Accept', 'application/json')
          .send({
            caption: 'This is an updated test caption',
            description: 'This is an updated test description',
          })
          .expect(HttpStatus.OK);
        const record = await models.Photo.findByPk('d0cb02d1-e95f-4d05-8b90-f2db36357e83');
        assert.deepStrictEqual(record.caption, 'This is an updated test caption');
        assert.deepStrictEqual(record.description, 'This is an updated test description');
      });
    });

    describe('POST /:id/feature', () => {
      it('creates a new Feature', async () => {
        await testSession
          .post('/api/auth/login')
          .set('Accept', 'application/json')
          .send({ email: 'admin.user@test.com', password: 'abcd1234' })
          .expect(HttpStatus.OK);

        await testSession
          .post('/api/photos/e6ecab76-48ca-4a89-8593-281153dff454/feature')
          .set('Accept', 'application/json')
          .send({
            year: 2022,
          })
          .expect(HttpStatus.OK);

        const photo = await models.Photo.findByPk('e6ecab76-48ca-4a89-8593-281153dff454');
        const feature = await photo.getFeature();
        assert(feature);
        assert.deepStrictEqual(feature.UserId, 1);
        assert.deepStrictEqual(feature.year, 2022);
        assert.deepStrictEqual(feature.position, 2);
      });

      it('updates the year of a Feature', async () => {
        await testSession
          .post('/api/photos/719a0396-782e-4edc-934c-72a23689f89f/feature')
          .set('Accept', 'application/json')
          .send({
            year: 2022,
          })
          .expect(HttpStatus.OK);

        const photo = await models.Photo.findByPk('719a0396-782e-4edc-934c-72a23689f89f');
        const feature = await photo.getFeature();
        assert(feature);
        assert.deepStrictEqual(feature.UserId, 2);
        assert.deepStrictEqual(feature.year, 2022);
        assert.deepStrictEqual(feature.position, 2);
      });

      it('updates the position(s) of a Feature', async () => {
        await testSession
          .post('/api/photos/719a0396-782e-4edc-934c-72a23689f89f/feature')
          .set('Accept', 'application/json')
          .send({
            year: 2022,
          })
          .expect(HttpStatus.OK);

        await testSession
          .post('/api/photos/719a0396-782e-4edc-934c-72a23689f89f/feature')
          .set('Accept', 'application/json')
          .send({
            year: 2022,
            position: 1,
          })
          .expect(HttpStatus.OK);

        const user = await models.User.findByPk(2);
        const features = await user.getFeatures({ where: { year: 2022 }, order: [['position', 'ASC']] });
        assert.deepStrictEqual(features.length, 2);
        assert.deepStrictEqual(features[0].PhotoId, '719a0396-782e-4edc-934c-72a23689f89f');
        assert.deepStrictEqual(features[0].position, 1);
        assert.deepStrictEqual(features[1].PhotoId, 'd0cb02d1-e95f-4d05-8b90-f2db36357e83');
        assert.deepStrictEqual(features[1].position, 2);
      });
    });

    describe('POST /:id/rate', () => {
      it('creates a new rating', async () => {
        const response = await testSession
          .post('/api/photos/e6ecab76-48ca-4a89-8593-281153dff454/rate')
          .set('Accept', 'application/json')
          .send({
            value: 3,
          })
          .expect(HttpStatus.OK);
        assert(response.body.id);

        const rating = await models.Rating.findByPk(response.body.id);
        assert.deepStrictEqual(rating.value, 3);
      });

      it('updates an existing rating', async () => {
        const response = await testSession
          .post('/api/photos/e6ecab76-48ca-4a89-8593-281153dff454/rate')
          .set('Accept', 'application/json')
          .send({
            value: 3,
          })
          .expect(HttpStatus.OK);
        assert(response.body.id);

        await testSession
          .post('/api/photos/e6ecab76-48ca-4a89-8593-281153dff454/rate')
          .set('Accept', 'application/json')
          .send({
            value: 2,
          })
          .expect(HttpStatus.OK);

        const rating = await models.Rating.findByPk(response.body.id);
        assert.deepStrictEqual(rating.value, 2);
      });

      it('removes a rating', async () => {
        const response = await testSession
          .post('/api/photos/e6ecab76-48ca-4a89-8593-281153dff454/rate')
          .set('Accept', 'application/json')
          .send({
            value: 3,
          })
          .expect(HttpStatus.OK);
        assert(response.body.id);

        await testSession
          .post('/api/photos/e6ecab76-48ca-4a89-8593-281153dff454/rate')
          .set('Accept', 'application/json')
          .send({
            value: 0,
          })
          .expect(HttpStatus.OK);

        const rating = await models.Rating.findByPk(response.body.id);
        assert.deepStrictEqual(rating, null);

        const photo = await models.Photo.findByPk('e6ecab76-48ca-4a89-8593-281153dff454');
        assert.deepStrictEqual(photo.rating, 0);
      });
    });
  });
});
