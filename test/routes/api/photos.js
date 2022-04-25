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
    ]);
    await helper.loadFixtures(['users', 'photos']);
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
        assert(response.body?.length, 2);

        const docs = response.body;
        assert.deepStrictEqual(docs[0].caption, 'Test photo 3');
        assert.deepStrictEqual(docs[1].caption, 'Test photo 2');
      });

      it('returns all public photos for a user', async () => {
        /// request photos
        const response = await testSession.get('/api/photos?userId=1').set('Accept', 'application/json').expect(HttpStatus.OK);
        assert(response.body?.length, 1);

        const docs = response.body;
        assert.deepStrictEqual(docs[0].caption, 'Test photo 2');
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
        assert(response.body?.length, 2);

        const docs = response.body;
        assert.deepStrictEqual(docs[0].caption, 'Test photo 3');
        assert.deepStrictEqual(docs[1].caption, 'Test photo 2');
        assert.deepStrictEqual(docs[2].caption, 'Test photo 1');
      });

      it('returns all photos for a user', async () => {
        /// request photos
        const response = await testSession.get('/api/photos?userId=1').set('Accept', 'application/json').expect(HttpStatus.OK);
        assert(response.body?.length, 1);

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
            isPublic: true,
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
        assert.deepStrictEqual(record.isPublic, true);
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
            isPublic: false,
          })
          .expect(HttpStatus.OK);
        const record = await models.Photo.findByPk('d0cb02d1-e95f-4d05-8b90-f2db36357e83');
        assert.deepStrictEqual(record.caption, 'This is an updated test caption');
        assert.deepStrictEqual(record.description, 'This is an updated test description');
        assert(record.isPublic === false);
      });
    });
  });
});
