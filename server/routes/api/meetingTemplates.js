import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';

import helpers from '../helpers.js';
import models from '../../models/index.js';
import interceptors from '../interceptors.js';

const router = express.Router();

router.get('/', interceptors.requireLogin, async (req, res) => {
  const options = {
    page: req.query.page || '1',
    order: [['startsAt', 'DESC']],
  };
  const { records, pages, total } = await models.MeetingTemplate.paginate(options);
  helpers.setPaginationHeaders(req, res, options.page, pages, total);
  res.json(records.map((record) => record.toJSON()));
});

router.get('/:id', interceptors.requireAdmin, async (req, res) => {
  const meetingTemplate = await models.MeetingTemplate.findByPk(req.params.id);
  if (meetingTemplate) {
    res.json(meetingTemplate.toJSON());
  } else {
    res.status(StatusCodes.NOT_FOUND).end();
  }
});

router.patch('/:id', interceptors.requireAdmin, async (req, res) => {
  let meetingTemplate;
  await models.sequelize.transaction(async (transaction) => {
    meetingTemplate = await models.MeetingTemplate.findByPk(req.params.id, { transaction });
    await meetingTemplate.update(_.pick(req.body, ['frequency', 'topic', 'callLink', 'callDetails', 'maxUploadsCount', 'allowedUserIds']));
  });
  if (meetingTemplate) {
    res.json(meetingTemplate.toJSON());
  } else {
    res.status(StatusCodes.NOT_FOUND).end();
  }
});

router.delete('/:id', interceptors.requireAdmin, async (req, res) => {
  let meetingTemplate;
  await models.sequelize.transaction(async (transaction) => {
    meetingTemplate = await models.MeetingTemplate.findByPk(req.params.id, { transaction });
    if (meetingTemplate) {
      await meetingTemplate.destroy({ transaction });
    }
  });
  if (meetingTemplate) {
    res.status(StatusCodes.OK).end();
  } else {
    res.status(StatusCodes.NOT_FOUND).end();
  }
});

export default router;
