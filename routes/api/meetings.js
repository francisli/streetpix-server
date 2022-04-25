const express = require('express');
const HttpStatus = require('http-status-codes');
const _ = require('lodash');
const { DateTime } = require('luxon');

const helpers = require('../helpers');
const models = require('../../models');
const interceptors = require('../interceptors');

const router = express.Router();

router.get('/', interceptors.requireLogin, async (req, res) => {
  const options = {
    page: req.query.page || '1',
    order: [['startsAt', 'DESC']],
  };
  const { records, pages, total } = await models.Meeting.paginate(options);
  helpers.setPaginationHeaders(req, res, options.page, pages, total);
  res.json(records.map((record) => record.toJSON()));
});

router.post('/', interceptors.requireAdmin, async (req, res) => {
  try {
    let meeting;
    await models.sequelize.transaction(async (transaction) => {
      let meetingTemplate = null;
      meeting = models.Meeting.build(
        _.pick(req.body, ['startsAt', 'callLink', 'callDetails', 'topic', 'maxUploadsCount', 'allowedUserIds'])
      );
      if (req.body.MeetingTemplateId) {
        meetingTemplate = await models.MeetingTemplate.findByPk(req.body.MeetingTemplateId, { transaction });
        if (DateTime.fromISO(req.body.startsAt) > DateTime.fromJSDate(meetingTemplate.latestAt)) {
          meetingTemplate.latestAt = req.body.startsAt;
          await meetingTemplate.save({ transaction });
        }
      } else if (req.body.frequency) {
        meetingTemplate = models.MeetingTemplate.build(
          _.pick(req.body, ['startsAt', 'frequency', 'callLink', 'callDetails', 'topic', 'maxUploadsCount', 'allowedUserIds'])
        );
        meetingTemplate.latestAt = meetingTemplate.startsAt;
        meetingTemplate.CreatedByUserId = req.user.id;
        meetingTemplate.UpdatedByUserId = req.user.id;
        await meetingTemplate.save({ transaction });
      }
      meeting.MeetingTemplateId = meetingTemplate?.id;
      meeting.CreatedByUserId = req.user.id;
      meeting.UpdatedByUserId = req.user.id;
      await meeting.save({ transaction });
    });
    res.status(HttpStatus.CREATED).json(meeting.toJSON());
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: error.errors,
      });
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
    }
  }
});

router.get('/:id', interceptors.requireLogin, async (req, res) => {
  try {
    const meeting = await models.Meeting.findByPk(req.params.id, {
      include: [
        {
          model: models.MeetingSubmission,
          include: [
            {
              model: models.Photo,
              include: models.User,
            },
          ],
        },
      ],
    });
    if (meeting) {
      res.json(meeting.toJSON());
    } else {
      res.status(HttpStatus.NOT_FOUND).end();
    }
  } catch {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
  }
});

router.patch('/:id', interceptors.requireAdmin, async (req, res) => {
  try {
    let meeting;
    await models.sequelize.transaction(async (transaction) => {
      meeting = await models.Meeting.findByPk(req.params.id, {
        transaction,
      });
      if (meeting) {
        await meeting.update(_.pick(req.body, ['startsAt', 'topic', 'callLink', 'callDetails', 'maxUploadsCount', 'allowedUserIds']));
      }
    });
    if (meeting) {
      res.json(meeting.toJSON());
    } else {
      res.status(HttpStatus.NOT_FOUND).end();
    }
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: error.errors,
      });
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
    }
  }
});

router.post('/:id/submissions', interceptors.requireLogin, async (req, res) => {
  try {
    let meetingSubmission;
    await models.sequelize.transaction(async (transaction) => {
      const meeting = await models.Meeting.findByPk(req.params.id, {
        include: [
          {
            model: models.MeetingSubmission,
            include: models.Photo,
          },
        ],
        transaction,
      });
      if (!meeting) {
        res.status(HttpStatus.NOT_FOUND).end();
        return;
      }
      const priorSubmissions = meeting.MeetingSubmissions.filter((ms) => ms.Photo.UserId === req.user.id);
      if (priorSubmissions.length >= meeting.maxUploadCount) {
        res.status(HttpStatus.FORBIDDEN).end();
      }
      const photo = models.Photo.build(_.pick(req.body, ['file', 'caption', 'description', 'isPublic', 'license', 'acquireLicensePage']));
      photo.UserId = req.user.id;
      await photo.save({ transaction });
      meetingSubmission = await models.MeetingSubmission.create(
        {
          MeetingId: meeting.id,
          PhotoId: photo.id,
          position: priorSubmissions.reduce((position, ms) => (ms.position > position ? ms.position : position), 0) + 1,
        },
        { transaction }
      );
      meetingSubmission.setDataValue('Photo', photo);
    });
    res.status(HttpStatus.CREATED).json(meetingSubmission.toJSON());
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: error.errors,
      });
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
    }
  }
});

router.delete('/:id', interceptors.requireAdmin, async (req, res) => {
  let meeting;
  await models.sequelize.transaction(async (transaction) => {
    meeting = await models.Meeting.findByPk(req.params.id, { transaction });
    if (meeting) {
      await meeting.destroy({ transaction });
    }
  });
  if (meeting) {
    res.status(HttpStatus.OK).end();
  } else {
    res.status(HttpStatus.NOT_FOUND).end();
  }
});

module.exports = router;
