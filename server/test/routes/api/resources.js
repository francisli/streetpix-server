import assert from 'assert';
import { StatusCodes } from 'http-status-codes';
import session from 'supertest-session';

import helper from '../../helper.js';
import app from '../../../app.js';
import models from '../../../models/index.js';

describe('/api/resources', () => {
  let testSession;

  beforeEach(async () => {
    await helper.loadFixtures(['users', 'resourceCategories', 'resources']);
    testSession = session(app);
  });

  context('unauthenticated', () => {
    it('GET / returns 401', async () => {
      await testSession.get('/api/resources').set('Accept', 'application/json').expect(StatusCodes.UNAUTHORIZED);
    });

    it('GET /:id returns 401', async () => {
      await testSession.get('/api/resources/202').set('Accept', 'application/json').expect(StatusCodes.UNAUTHORIZED);
    });

    it('POST / returns 401', async () => {
      await testSession.post('/api/resources').set('Accept', 'application/json').send({ name: 'X' }).expect(StatusCodes.UNAUTHORIZED);
    });

    it('PATCH /:id returns 401', async () => {
      await testSession.patch('/api/resources/202').set('Accept', 'application/json').send({ name: 'Y' }).expect(StatusCodes.UNAUTHORIZED);
    });

    it('DELETE /:id returns 401', async () => {
      await testSession.delete('/api/resources/202').set('Accept', 'application/json').expect(StatusCodes.UNAUTHORIZED);
    });
  });

  context('authenticated (regular user)', () => {
    beforeEach(async () => {
      await testSession
        .post('/api/auth/login')
        .set('Accept', 'application/json')
        .send({ email: 'regular.user@test.com', password: 'abcd1234' })
        .expect(StatusCodes.OK);
    });

    describe('GET /', () => {
      it('lists resources with pagination headers', async () => {
        const response = await testSession
          .get('/api/resources?categoryId=parent-a')
          .set('Accept', 'application/json')
          .expect(StatusCodes.OK);
        assert(Array.isArray(response.body));
        assert(response.headers['x-total-count']);
        assert.strictEqual(response.body.length, 2);
        assert.strictEqual(response.body[0].name, 'Res 1');
        assert.strictEqual(response.body[1].name, 'Res 2');
      });
    });

    describe('GET /:id', () => {
      it('shows a resource', async () => {
        const response = await testSession.get('/api/resources/202').set('Accept', 'application/json').expect(StatusCodes.OK);
        const doc = response.body;
        assert.strictEqual(doc.id, 202);
        assert.strictEqual(doc.name, 'Res 1');
      });

      it('returns 404 for missing resource', async () => {
        await testSession.get('/api/resources/999999').set('Accept', 'application/json').expect(StatusCodes.NOT_FOUND);
      });
    });

    describe('POST /', () => {
      it('creates a new resource belonging to the user', async () => {
        const payload = { name: 'New Resource', desc: 'D', url: 'https://example.com', CategoryId: 101 };
        const response = await testSession
          .post('/api/resources')
          .set('Accept', 'application/json')
          .send(payload)
          .expect(StatusCodes.CREATED);

        const created = await models.Resource.findByPk(response.body.id);
        assert(created);
        assert.strictEqual(created.name, 'New Resource');
        assert.strictEqual(created.UserId, 2);
        assert.strictEqual(created.CategoryId, 101);
      });
    });

    describe('PATCH /:id', () => {
      it('updates own resource', async () => {
        const response = await testSession
          .patch('/api/resources/202')
          .set('Accept', 'application/json')
          .send({ name: 'Updated Name' })
          .expect(StatusCodes.OK);
        assert.strictEqual(response.body.name, 'Updated Name');
        const rec = await models.Resource.findByPk(202);
        assert.strictEqual(rec.name, 'Updated Name');
      });

      it("returns 403 when updating someone else's resource", async () => {
        await testSession
          .patch(`/api/resources/203`)
          .set('Accept', 'application/json')
          .send({ name: 'Nope' })
          .expect(StatusCodes.FORBIDDEN);
      });

      it('returns 404 when updating missing resource', async () => {
        await testSession
          .patch('/api/resources/1234567')
          .set('Accept', 'application/json')
          .send({ name: 'Nope' })
          .expect(StatusCodes.NOT_FOUND);
      });
    });

    describe('DELETE /:id', () => {
      it('deletes own resource', async () => {
        await testSession.delete('/api/resources/202').set('Accept', 'application/json').expect(StatusCodes.OK);
        const after = await models.Resource.findByPk(202);
        assert.strictEqual(after, null);
      });

      it("returns 403 when deleting someone else's resource", async () => {
        await testSession.delete(`/api/resources/203`).set('Accept', 'application/json').expect(StatusCodes.FORBIDDEN);
      });

      it('returns 404 when deleting missing resource', async () => {
        await testSession.delete('/api/resources/987654').set('Accept', 'application/json').expect(StatusCodes.NOT_FOUND);
      });
    });
  });

  context('admin only', () => {
    beforeEach(async () => {
      await testSession
        .post('/api/auth/login')
        .set('Accept', 'application/json')
        .send({ email: 'admin.user@test.com', password: 'abcd1234' })
        .expect(StatusCodes.OK);
    });

    it('can update any resource', async () => {
      const response = await testSession
        .patch(`/api/resources/202`)
        .set('Accept', 'application/json')
        .send({ name: 'Admin Updated' })
        .expect(StatusCodes.OK);
      assert.strictEqual(response.body.name, 'Admin Updated');
    });

    it('can delete any resource', async () => {
      await testSession.delete(`/api/resources/202`).set('Accept', 'application/json').expect(StatusCodes.OK);
      const after = await models.Resource.findByPk(202);
      assert.strictEqual(after, null);
    });
  });
});
