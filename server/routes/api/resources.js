import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';

import helpers from '../helpers.js';
import models from '../../models/index.js';
import interceptors from '../interceptors.js';

const router = express.Router();

// List resources with pagination
router.get('/', interceptors.requireLogin, async (req, res) => {
  const options = {
    page: req.query.page || '1',
    include: [models.User],
    order: [['name', 'ASC']],
  };
  const { records, pages, total } = await models.Resource.paginate(options);
  helpers.setPaginationHeaders(req, res, options.page, pages, total);
  res.json(records.map((r) => r.toJSON()));
});

// Create resource
router.post('/', interceptors.requireLogin, async (req, res) => {
  const payload = _.pick(req.body, ['name', 'desc', 'url', 'file', 'CategoryId']);
  const record = models.Resource.build(payload);
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

// Show resource
router.get('/:id', interceptors.requireLogin, async (req, res) => {
  try {
    const record = await models.Resource.findByPk(req.params.id, {
      include: [{ model: models.ResourceCategory, as: 'Category' }, models.User],
    });
    if (record) {
      res.json(record.toJSON());
    } else {
      res.status(StatusCodes.NOT_FOUND).end();
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
  }
});

// Update resource
router.patch('/:id', interceptors.requireLogin, async (req, res) => {
  let record;
  await models.sequelize.transaction(async (transaction) => {
    record = await models.Resource.findByPk(req.params.id, { transaction });
    if (record && (req.user.isAdmin || record.UserId == req.user.id)) {
      await record.update(_.pick(req.body, ['name', 'desc', 'url', 'file', 'CategoryId']), { transaction });
    }
  });
  if (!record) {
    res.status(StatusCodes.NOT_FOUND).end();
  } else if (!req.user.isAdmin && record.UserId !== req.user.id) {
    res.status(StatusCodes.FORBIDDEN).end();
  } else {
    res.json(record.toJSON());
  }
});

// Delete resource
router.delete('/:id', interceptors.requireLogin, async (req, res) => {
  let record;
  await models.sequelize.transaction(async (transaction) => {
    record = await models.Resource.findByPk(req.params.id, { transaction });
    if (record && (req.user.isAdmin || record.UserId == req.user.id)) {
      await record.destroy({ transaction });
    }
  });
  if (!record) {
    res.status(StatusCodes.NOT_FOUND).end();
  } else if (!req.user.isAdmin && record.UserId !== req.user.id) {
    res.status(StatusCodes.FORBIDDEN).end();
  } else {
    res.status(StatusCodes.OK).end();
  }
});

export default router;
