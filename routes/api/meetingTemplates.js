const express = require('express');
const HttpStatus = require('http-status-codes');
const _ = require('lodash');

const helpers = require('../helpers');
const models = require('../../models');
const interceptors = require('../interceptors');

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
    res.status(HttpStatus.NOT_FOUND).end();
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
    res.status(HttpStatus.NOT_FOUND).end();
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
    res.status(HttpStatus.OK).end();
  } else {
    res.status(HttpStatus.NOT_FOUND).end();
  }
});

module.exports = router;
