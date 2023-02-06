const assert = require('assert');
const fs = require('fs-extra');
const HttpStatus = require('http-status-codes');
const path = require('path');
const session = require('supertest-session');

const helper = require('../../helper');
const app = require('../../../app');
const models = require('../../../models');

describe('/api/meetings', () => {
  let testSession;

  beforeEach(async function named() {
    this.timeout(8000);
    await helper.loadUploads([
      ['512x512.png', 'e6ecab76-48ca-4a89-8593-281153dff454.jpg'],
      ['512x512.png', 'ea92aaca-4fa3-4ff7-96e9-dd0db71b5143.jpg'],
      ['512x512.png', 'd0cb02d1-e95f-4d05-8b90-f2db36357e83.jpg'],
      ['512x512.png', '719a0396-782e-4edc-934c-72a23689f89f.jpg'],
    ]);
    await helper.loadFixtures(['users', 'meetingTemplates', 'meetings', 'photos', 'meetingSubmissions']);
    testSession = session(app);
    await testSession
      .post('/api/auth/login')
      .set('Accept', 'application/json')
      .send({ email: 'admin.user@test.com', password: 'abcd1234' })
      .expect(HttpStatus.OK);
  });

  afterEach(async () => {
    await helper.cleanAssets();
    fs.removeSync(path.resolve(__dirname, '../../../public/assets', process.env.ASSET_PATH_PREFIX));
  });

  describe('GET /', () => {
    it('returns a list of Meetings', async () => {
      const response = await testSession.get('/api/meetings').set('Accept', 'application/json').expect(HttpStatus.OK);
      assert.deepStrictEqual(response.body.length, 3);
      assert.deepStrictEqual(response.body[0].topic, 'Topic 2');
      assert.deepStrictEqual(response.body[1].topic, 'Topic 1');
      assert.deepStrictEqual(response.body[2].topic, 'Topic 0');
    });

    it('filters by year', async () => {
      const response = await testSession.get('/api/meetings?year=2021').set('Accept', 'application/json').expect(HttpStatus.OK);
      assert.deepStrictEqual(response.body.length, 1);
      assert.deepStrictEqual(response.body[0].topic, 'Topic 0');
    });
  });

  describe('POST /', () => {
    it('creates a new Meeting', async () => {
      const response = await testSession
        .post('/api/meetings')
        .set('Accept', 'application/json')
        .send({
          startsAt: '2022-02-14T19:00:00',
          callLink: 'https://calllink.com/asdf',
          callDetails: 'These are the call details',
          topic: 'This is the discussion topic',
          maxUploadsCount: 20,
          allowedUserIds: [1, 2],
        })
        .expect(HttpStatus.CREATED);
      assert(response.body.id);

      const meeting = await models.Meeting.findByPk(response.body.id);
      assert.deepStrictEqual(JSON.stringify(meeting.startsAt), '"2022-02-14T19:00:00.000Z"');
      assert.deepStrictEqual(meeting.callLink, 'https://calllink.com/asdf');
      assert.deepStrictEqual(meeting.callDetails, 'These are the call details');
      assert.deepStrictEqual(meeting.topic, 'This is the discussion topic');
      assert.deepStrictEqual(meeting.maxUploadsCount, 20);
      assert.deepStrictEqual(meeting.allowedUserIds, [1, 2]);
    });

    it('creates a new recurring MeetingTemplate and first Meeting', async () => {
      const response = await testSession
        .post('/api/meetings')
        .set('Accept', 'application/json')
        .send({
          startsAt: '2022-02-14T19:00:00',
          frequency: 7,
          callLink: 'https://calllink.com/asdf',
          callDetails: 'These are the call details',
          topic: 'This is the discussion topic',
          maxUploadsCount: 20,
          allowedUserIds: null,
        })
        .expect(HttpStatus.CREATED);
      assert(response.body.id);

      const meeting = await models.Meeting.findByPk(response.body.id);
      assert.deepStrictEqual(JSON.stringify(meeting.startsAt), '"2022-02-14T19:00:00.000Z"');
      assert.deepStrictEqual(meeting.callLink, 'https://calllink.com/asdf');
      assert.deepStrictEqual(meeting.callDetails, 'These are the call details');
      assert.deepStrictEqual(meeting.topic, 'This is the discussion topic');
      assert.deepStrictEqual(meeting.maxUploadsCount, 20);
      assert.deepStrictEqual(meeting.allowedUserIds, null);

      assert(meeting.MeetingTemplateId);
      const meetingTemplate = await meeting.getMeetingTemplate();
      assert.deepStrictEqual(JSON.stringify(meetingTemplate.startsAt), '"2022-02-14T19:00:00.000Z"');
      assert.deepStrictEqual(meetingTemplate.callLink, 'https://calllink.com/asdf');
      assert.deepStrictEqual(meetingTemplate.callDetails, 'These are the call details');
      assert.deepStrictEqual(meetingTemplate.topic, 'This is the discussion topic');
      assert.deepStrictEqual(meetingTemplate.maxUploadsCount, 20);
      assert.deepStrictEqual(meetingTemplate.allowedUserIds, null);
      assert.deepStrictEqual(meetingTemplate.frequency, 7);
    });

    it('creates a new Meeting from a MeetingTemplate', async () => {
      const response = await testSession
        .post('/api/meetings')
        .set('Accept', 'application/json')
        .send({
          MeetingTemplateId: '1633bc60-c8da-45bf-ae5f-471d617e7c37',
          startsAt: '2022-02-17T19:00:00',
          callLink: 'https://calllink.com/asdf',
          callDetails: 'These are the call details',
          topic: 'This is the discussion topic',
          maxUploadsCount: 20,
          allowedUserIds: null,
        })
        .expect(HttpStatus.CREATED);
      assert(response.body.id);

      const meeting = await models.Meeting.findByPk(response.body.id);
      assert.deepStrictEqual(JSON.stringify(meeting.startsAt), '"2022-02-17T19:00:00.000Z"');
      assert.deepStrictEqual(meeting.callLink, 'https://calllink.com/asdf');
      assert.deepStrictEqual(meeting.callDetails, 'These are the call details');
      assert.deepStrictEqual(meeting.topic, 'This is the discussion topic');
      assert.deepStrictEqual(meeting.maxUploadsCount, 20);
      assert.deepStrictEqual(meeting.allowedUserIds, null);
      assert.deepStrictEqual(meeting.MeetingTemplateId, '1633bc60-c8da-45bf-ae5f-471d617e7c37');

      const meetingTemplate = await meeting.getMeetingTemplate();
      assert.deepStrictEqual(JSON.stringify(meetingTemplate.latestAt), '"2022-02-17T19:00:00.000Z"');
    });
  });

  describe('GET /:id', () => {
    it('retrieves a Meeting and its MeetingSubmissions', async () => {
      const response = await testSession
        .get('/api/meetings/12464934-3e8e-4034-8064-009c28147a27')
        .set('Accept', 'application/json')
        .expect(HttpStatus.OK);
      const data = response.body;
      assert.deepStrictEqual(data.startsAt, '2022-02-10T19:00:00.000Z');
      assert.deepStrictEqual(data.callLink, 'https://calllink.com/asdf');
      assert.deepStrictEqual(data.callDetails, 'These are the call details');
      assert.deepStrictEqual(data.topic, 'Topic 2');
      assert.deepStrictEqual(data.maxUploadsCount, 20);
      assert.deepStrictEqual(data.allowedUserIds, null);
      assert.deepStrictEqual(data.MeetingSubmissions.length, 2);
    });
  });

  describe('POST /:id/submissions', () => {
    it('submits a new photo for the Meeting', async () => {
      await helper.loadUploads([['metadata.jpg', '227d54fe-6abf-4130-a75e-3cc90d92dcb6.jpg']]);
      const response = await testSession
        .post('/api/meetings/4a8b1331-8d68-470b-bfc9-265c2cc8f039/submissions')
        .set('Accept', 'application/json')
        .send({
          file: '227d54fe-6abf-4130-a75e-3cc90d92dcb6.jpg',
          caption: 'This is a test caption',
          description: 'This is a test description',
        })
        .expect(HttpStatus.CREATED);
      const meetingSubmission = await models.MeetingSubmission.findByPk(response.body.id);
      assert(meetingSubmission);
      assert.deepStrictEqual(meetingSubmission.position, 2);
      const photo = await meetingSubmission.getPhoto();
      assert(photo);
      assert.deepStrictEqual(photo.file, '227d54fe-6abf-4130-a75e-3cc90d92dcb6.jpg');
      assert(await helper.assetPathExists(path.join('photos', photo.id, 'file', '227d54fe-6abf-4130-a75e-3cc90d92dcb6.jpg')));
      assert(await helper.assetPathExists(path.join('photos', photo.id, 'thumb', '227d54fe-6abf-4130-a75e-3cc90d92dcb6.jpg')));
      assert(await helper.assetPathExists(path.join('photos', photo.id, 'large', '227d54fe-6abf-4130-a75e-3cc90d92dcb6.jpg')));
      assert.deepStrictEqual(photo.caption, 'This is a test caption');
      assert.deepStrictEqual(photo.description, 'This is a test description');
      assert.deepStrictEqual(photo.takenAt, new Date('2022-08-07T20:41:18.000Z'));
    });
  });

  describe('DELETE /:id', () => {
    it('deletes a Meeting', async () => {
      await testSession
        .delete('/api/meetings/4a8b1331-8d68-470b-bfc9-265c2cc8f039')
        .set('Accept', 'application/json')
        .expect(HttpStatus.OK);
      const meeting = await models.Meeting.findByPk('4a8b1331-8d68-470b-bfc9-265c2cc8f039');
      assert.deepStrictEqual(meeting, null);
    });
  });
});
