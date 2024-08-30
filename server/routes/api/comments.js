import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';

import helpers from '../helpers.js';
import models from '../../models/index.js';
import interceptors from '../interceptors.js';

const router = express.Router();

router.get('/', interceptors.requireAdmin, async (req, res) => {
  const options = {
    page: req.query.page || '1',
    order: [['createdAt', 'DESC']],
  };
  const { records, pages, total } = await models.Comment.paginate(options);
  helpers.setPaginationHeaders(req, res, options.page, pages, total);
  res.json(records.map((record) => record.toJSON()));
});

router.post('/', interceptors.requireLogin, async (req, res) => {
  const record = models.Comment.build(_.pick(req.body, ['PhotoId', 'body']));
  record.UserId = req.user.id;
  try {
    await record.save();
    res.status(StatusCodes.CREATED).json(record.toJSON());
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        status: StatusCodes.UNPROCESSABLE_ENTITY,
        errors: error.errors,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    }
  }
});

router.get('/:id', async (req, res) => {
  req.logout(async () => {
    const record = await models.Comment.findByPk(req.params.id);
    if (record) {
      res.json(record.toJSON());
    } else {
      res.status(StatusCodes.NOT_FOUND).end();
    }
  });
});

router.patch('/:id', async (req, res) => {
  await models.sequelize.transaction(async (transaction) => {
    const record = await models.Comment.findByPk(req.params.id, { transaction });
    if (record) {
      if (!req.user.isAdmin && record.UserId !== req.user.id) {
        res.status(StatusCodes.FORBIDDEN).end();
        return;
      }
      await record.update(_.pick(req.body, ['body']), { transaction });
      res.json(record.toJSON());
    } else {
      res.status(StatusCodes.NOT_FOUND).end();
    }
  });
});

router.delete('/:id', interceptors.requireLogin, async (req, res) => {
  let record;
  await models.sequelize.transaction(async (transaction) => {
    record = await models.Comment.findByPk(req.params.id, { transaction });
    if (record) {
      if (req.user.isAdmin || record.UserId === req.user.id) {
        await record.destroy({ transaction });
      }
    }
  });
  if (record) {
    if (!req.user.isAdmin && record.UserId !== req.user.id) {
      res.status(StatusCodes.FORBIDDEN).end();
    } else {
      res.status(StatusCodes.OK).end();
    }
  } else {
    res.status(StatusCodes.NOT_FOUND).end();
  }
});

export default router;
