import assert from 'assert';
import { StatusCodes } from 'http-status-codes';
import session from 'supertest-session';

import helper from '../../helper.js';
import app from '../../../app.js';
import models from '../../../models/index.js';

describe('/api/resource-categories', () => {
  let testSession;

  beforeEach(async () => {
    await helper.loadFixtures(['users', 'resourceCategories']);
    testSession = session(app);
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
      it('lists categories ordered by position with children included', async () => {
        // fixtures loaded in top-level beforeEach
        const response = await testSession.get('/api/resource-categories').set('Accept', 'application/json').expect(StatusCodes.OK);
        const docs = response.body;
        assert(Array.isArray(docs));
        // parentB should come before parentA due to lower position
        assert.deepStrictEqual(docs[0].name, 'Parent B');
        assert.deepStrictEqual(docs[1].name, 'Parent A');
        // children included and ordered by position ASC
        const aChildren = docs[1].Children || [];
        assert.deepStrictEqual(aChildren.length, 2);
        assert.deepStrictEqual(aChildren[0].name, 'A Child 1');
        assert.deepStrictEqual(aChildren[1].name, 'A Child 2');
        // pagination headers present
        assert(response.headers['x-total-count']);
      });
    });

    describe('GET /:id', () => {
      it('shows a category with children', async () => {
        // fixtures loaded in top-level beforeEach
        const parentId = 101;

        const response = await testSession
          .get(`/api/resource-categories/${parentId}`)
          .set('Accept', 'application/json')
          .expect(StatusCodes.OK);

        const data = response.body;
        assert.deepStrictEqual(data.id, parentId);
        assert.deepStrictEqual((data.Children || []).length, 2);
        assert.deepStrictEqual(data.Children[0].name, 'A Child 1');
        assert.deepStrictEqual(data.Children[1].name, 'A Child 2');
      });

      it('returns 404 for missing category', async () => {
        await testSession.get('/api/resource-categories/999999').set('Accept', 'application/json').expect(StatusCodes.NOT_FOUND);
      });
    });

    describe('POST / (forbidden)', () => {
      it('returns 403 for non-admin', async () => {
        await testSession
          .post('/api/resource-categories')
          .set('Accept', 'application/json')
          .send({ name: 'Nope' })
          .expect(StatusCodes.FORBIDDEN);
      });
    });

    describe('PATCH /:id (forbidden)', () => {
      it('returns 403 for non-admin', async () => {
        const id = 100;
        await testSession
          .patch(`/api/resource-categories/${id}`)
          .set('Accept', 'application/json')
          .send({ name: 'New' })
          .expect(StatusCodes.FORBIDDEN);
      });
    });

    describe('DELETE /:id (forbidden)', () => {
      it('returns 403 for non-admin', async () => {
        const id = 100;
        await testSession.delete(`/api/resource-categories/${id}`).set('Accept', 'application/json').expect(StatusCodes.FORBIDDEN);
      });
    });
  });

  context('unauthenticated', () => {
    beforeEach(async () => {
      // ensure no login in this context
      testSession = session(app);
    });

    it('GET / returns 401', async () => {
      await testSession.get('/api/resource-categories').set('Accept', 'application/json').expect(StatusCodes.UNAUTHORIZED);
    });

    it('GET /:id returns 401', async () => {
      await testSession.get('/api/resource-categories/1').set('Accept', 'application/json').expect(StatusCodes.UNAUTHORIZED);
    });

    it('POST / returns 401', async () => {
      await testSession
        .post('/api/resource-categories')
        .set('Accept', 'application/json')
        .send({ name: 'x' })
        .expect(StatusCodes.UNAUTHORIZED);
    });

    it('PATCH /:id returns 401', async () => {
      await testSession
        .patch('/api/resource-categories/1')
        .set('Accept', 'application/json')
        .send({ name: 'x' })
        .expect(StatusCodes.UNAUTHORIZED);
    });

    it('DELETE /:id returns 401', async () => {
      await testSession.delete('/api/resource-categories/1').set('Accept', 'application/json').expect(StatusCodes.UNAUTHORIZED);
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

    describe('POST /', () => {
      it('creates a new category', async () => {
        const response = await testSession
          .post('/api/resource-categories')
          .set('Accept', 'application/json')
          .send({ name: 'New Cat', link: 'https://example.com', position: 3 })
          .expect(StatusCodes.CREATED);

        const created = await models.ResourceCategory.findByPk(response.body.id);
        assert(created);
        assert.deepStrictEqual(created.name, 'New Cat');
        assert.deepStrictEqual(created.link, 'https://example.com');
        assert.deepStrictEqual(created.position, 3);
        assert.deepStrictEqual(created.UserId, 1);
      });
    });

    describe('PATCH /:id', () => {
      it('updates an existing category', async () => {
        const parentId = 100;
        const recordId = 103;

        const response = await testSession
          .patch(`/api/resource-categories/${recordId}`)
          .set('Accept', 'application/json')
          .send({ name: 'Updated', link: 'https://u.test', position: 1, CategoryId: parentId })
          .expect(StatusCodes.OK);

        const data = { ...response.body };
        delete data.updatedAt;
        assert.deepStrictEqual(data.name, 'Updated');
        assert.deepStrictEqual(data.link, 'https://u.test');
        assert.deepStrictEqual(data.position, 1);
        assert.deepStrictEqual(data.CategoryId, parentId);
      });

      it('returns 404 when updating missing category', async () => {
        await testSession
          .patch('/api/resource-categories/123456')
          .set('Accept', 'application/json')
          .send({ name: 'Nope' })
          .expect(StatusCodes.NOT_FOUND);
      });
    });

    describe('DELETE /:id', () => {
      it('deletes a category', async () => {
        const id = 102;
        await testSession.delete(`/api/resource-categories/${id}`).set('Accept', 'application/json').expect(StatusCodes.OK);
        const after = await models.ResourceCategory.findByPk(id);
        assert.deepStrictEqual(after, null);
      });

      it('returns 404 when deleting missing category', async () => {
        await testSession.delete('/api/resource-categories/987654').set('Accept', 'application/json').expect(StatusCodes.NOT_FOUND);
      });
    });
  });
});
