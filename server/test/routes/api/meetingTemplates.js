import assert from 'assert';
import { StatusCodes } from 'http-status-codes';
import session from 'supertest-session';

import helper from '../../helper.js';
import app from '../../../app.js';
import models from '../../../models/index.js';

describe('/api/meetings/templates', () => {
  let testSession;

  beforeEach(async () => {
    await helper.loadFixtures(['users', 'meetingTemplates', 'meetings']);
    testSession = session(app);
    await testSession
      .post('/api/auth/login')
      .set('Accept', 'application/json')
      .send({ email: 'admin.user@test.com', password: 'abcd1234' })
      .expect(StatusCodes.OK);
  });

  describe('GET /', () => {
    it('returns a list of MeetingTemplates', async () => {
      const response = await testSession.get('/api/meetings/templates').set('Accept', 'application/json').expect(StatusCodes.OK);
      assert.deepStrictEqual(response.body.length, 2);
      assert.deepStrictEqual(response.body[0].topic, 'Topic 2');
      assert.deepStrictEqual(response.body[1].topic, 'Topic 1');
    });
  });

  describe('DELETE /:id', () => {
    it('deletes a MeetingTemplate', async () => {
      const meeting = await models.Meeting.findByPk('4a8b1331-8d68-470b-bfc9-265c2cc8f039');
      assert.deepStrictEqual(meeting.MeetingTemplateId, '1633bc60-c8da-45bf-ae5f-471d617e7c37');

      await testSession
        .delete('/api/meetings/templates/1633bc60-c8da-45bf-ae5f-471d617e7c37')
        .set('Accept', 'application/json')
        .expect(StatusCodes.OK);
      const meetingTemplate = await models.MeetingTemplate.findByPk('1633bc60-c8da-45bf-ae5f-471d617e7c37');
      assert.deepStrictEqual(meetingTemplate, null);

      await meeting.reload();
      assert.deepStrictEqual(meeting.MeetingTemplateId, null);
    });
  });
});
