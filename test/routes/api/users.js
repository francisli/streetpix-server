const assert = require('assert');
const HttpStatus = require('http-status-codes');
const _ = require('lodash');
const session = require('supertest-session');

const helper = require('../../helper');
const app = require('../../../app');

describe('/api/users', () => {
  let testSession;

  beforeEach(async () => {
    await helper.loadFixtures(['users']);
    testSession = session(app);
  });

  context('admin authenticated', () => {
    beforeEach(async () => {
      await testSession
        .post('/api/auth/login')
        .set('Accept', 'application/json')
        .send({ email: 'admin.user@test.com', password: 'abcd1234' })
        .expect(HttpStatus.OK);
    });

    describe('GET /', () => {
      it('returns a list of Users ordered by last name, first name, email', async () => {
        /// request user list
        const response = await testSession.get('/api/users').set('Accept', 'application/json').expect(HttpStatus.OK);
        assert(response.body?.length, 2);

        const users = response.body;
        assert.deepStrictEqual(users[0].firstName, 'Admin');
        assert.deepStrictEqual(users[1].firstName, 'Regular');
      });
    });

    describe('GET /:id', () => {
      it('returns a User by its id', async () => {
        /// request user list
        const response = await testSession.get('/api/users/2').set('Accept', 'application/json').expect(HttpStatus.OK);

        assert.deepStrictEqual(response.body, {
          id: 2,
          firstName: 'Regular',
          lastName: 'User',
          username: 'regular',
          email: 'regular.user@test.com',
          phone: null,
          isAdmin: false,
          isPublic: false,
          picture: null,
          pictureUrl: null,
          bio: null,
          license: 'allrightsreserved',
          acquireLicensePage: null,
          website: null,
          createdAt: response.body.createdAt,
        });
      });
    });

    describe('PATCH /:id', () => {
      it('updates a User by its id', async () => {
        const response = await testSession
          .patch('/api/users/2')
          .set('Accept', 'application/json')
          .send({
            firstName: 'Normal',
            lastName: 'Person',
            username: 'normalperson',
            email: 'normal.person@test.com',
          })
          .expect(HttpStatus.OK);

        assert.deepStrictEqual(response.body, {
          id: 2,
          firstName: 'Normal',
          lastName: 'Person',
          username: 'normalperson',
          email: 'normal.person@test.com',
          phone: null,
          isAdmin: false,
          isPublic: false,
          picture: null,
          pictureUrl: null,
          bio: null,
          license: 'allrightsreserved',
          acquireLicensePage: null,
          website: null,
          createdAt: response.body.createdAt,
        });
      });

      it('validates required fields', async () => {
        const response = await testSession
          .patch('/api/users/2')
          .set('Accept', 'application/json')
          .send({
            firstName: '',
            lastName: '',
            email: '',
            password: 'foo',
            confirmPassword: '',
          })
          .expect(HttpStatus.UNPROCESSABLE_ENTITY);

        const error = response.body;
        assert.deepStrictEqual(error.status, HttpStatus.UNPROCESSABLE_ENTITY);
        assert.deepStrictEqual(error.errors.length, 5);
        assert(
          _.find(error.errors, {
            path: 'firstName',
            message: 'First name cannot be blank',
          })
        );
        assert(
          _.find(error.errors, {
            path: 'lastName',
            message: 'Last name cannot be blank',
          })
        );
        assert(
          _.find(error.errors, {
            path: 'email',
            message: 'Email cannot be blank',
          })
        );
        assert(
          _.find(error.errors, {
            path: 'password',
            message: 'Minimum eight characters, at least one letter and one number',
          })
        );
        assert(
          _.find(error.errors, {
            path: 'confirmPassword',
            message: 'Passwords do not match',
          })
        );
      });

      it('validates email is not already registered', async () => {
        const response = await testSession
          .patch('/api/users/2')
          .set('Accept', 'application/json')
          .send({
            email: 'admin.user@test.com',
          })
          .expect(HttpStatus.UNPROCESSABLE_ENTITY);

        const error = response.body;
        assert.deepStrictEqual(error.status, HttpStatus.UNPROCESSABLE_ENTITY);
        assert.deepStrictEqual(error.errors.length, 1);
        assert(
          _.find(error.errors, {
            path: 'email',
            message: 'Email already registered',
          })
        );
      });
    });
  });
});
