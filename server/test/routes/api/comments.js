import assert from 'assert';
import { StatusCodes } from 'http-status-codes';
import session from 'supertest-session';

import helper from '../../helper.js';
import app from '../../../app.js';
import models from '../../../models/index.js';

describe('/api/comments', () => {
  let testSession;

  beforeEach(async () => {
    await helper.loadUploads([
      ['512x512.png', 'e6ecab76-48ca-4a89-8593-281153dff454.jpg'],
      ['512x512.png', 'ea92aaca-4fa3-4ff7-96e9-dd0db71b5143.jpg'],
      ['512x512.png', 'd0cb02d1-e95f-4d05-8b90-f2db36357e83.jpg'],
      ['512x512.png', '719a0396-782e-4edc-934c-72a23689f89f.jpg'],
    ]);
    await helper.loadFixtures(['users', 'photos', 'comments', 'features', 'ratings', 'meetingTemplates', 'meetings', 'meetingSubmissions']);
    testSession = session(app);
    await testSession
      .post('/api/auth/login')
      .set('Accept', 'application/json')
      .send({ email: 'regular.user@test.com', password: 'abcd1234' })
      .expect(StatusCodes.OK);
  });

  context('authenticated', () => {
    beforeEach(async () => {
      await testSession
        .post('/api/auth/login')
        .set('Accept', 'application/json')
        .send({ email: 'regular.user@test.com', password: 'abcd1234' })
        .expect(StatusCodes.OK);
    });

    describe('POST /', () => {
      it('creates a new Comment', async () => {
        const response = await testSession
          .post('/api/comments')
          .set('Accept', 'application/json')
          .send({ PhotoId: 'e6ecab76-48ca-4a89-8593-281153dff454', body: 'Test comment' })
          .expect(StatusCodes.CREATED);

        assert(response.body?.id);
        const record = await models.Comment.findByPk(response.body.id);
        assert(record);
        assert.deepStrictEqual(record.body, 'Test comment');
        assert.deepStrictEqual(record.PhotoId, 'e6ecab76-48ca-4a89-8593-281153dff454');
        assert.deepStrictEqual(record.UserId, 2);
      });
    });

    describe('GET /:id', () => {
      it('returns a Comment by id', async () => {
        const response = await testSession
          .get('/api/comments/5e6ee1a4-d398-4926-b39c-77b87f124c0a')
          .set('Accept', 'application/json')
          .expect(StatusCodes.OK);
        const data = { ...response.body };
        delete data.updatedAt;
        assert.deepStrictEqual(data, {
          id: '5e6ee1a4-d398-4926-b39c-77b87f124c0a',
          PhotoId: 'e6ecab76-48ca-4a89-8593-281153dff454',
          UserId: 2,
          body: 'Test comment 2',
          createdAt: '2022-01-29T23:00:56.000Z',
        });
      });
    });

    describe('PATCH /:id', () => {
      it('updates a Comment by id', async () => {
        const response = await testSession
          .patch('/api/comments/5e6ee1a4-d398-4926-b39c-77b87f124c0a')
          .send({ body: 'Updated test comment' })
          .set('Accept', 'application/json')
          .expect(StatusCodes.OK);
        const data = { ...response.body };
        delete data.updatedAt;
        assert.deepStrictEqual(data, {
          id: '5e6ee1a4-d398-4926-b39c-77b87f124c0a',
          PhotoId: 'e6ecab76-48ca-4a89-8593-281153dff454',
          UserId: 2,
          body: 'Updated test comment',
          createdAt: '2022-01-29T23:00:56.000Z',
        });
      });
    });

    describe('DELETE /:id', () => {
      it('deletes a Comment by id', async () => {
        await testSession
          .delete('/api/comments/5e6ee1a4-d398-4926-b39c-77b87f124c0a')
          .set('Accept', 'application/json')
          .expect(StatusCodes.OK);
        const record = await models.Comment.findByPk('5e6ee1a4-d398-4926-b39c-77b87f124c0a');
        assert.deepStrictEqual(record, null);
      });
    });
  });
});
