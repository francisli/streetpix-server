import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';

import helpers from '../helpers.js';
import models from '../../models/index.js';
import interceptors from '../interceptors.js';

const router = express.Router();

// List categories with pagination
router.get('/', interceptors.requireLogin, async (req, res) => {
  const { page = '1', CategoryId = null } = req.query;
  const options = {
    page,
    include: [{ model: models.ResourceCategory, as: 'Children' }],
    where: { CategoryId },
    order: [
      ['position', 'ASC'],
      ['createdAt', 'ASC'],
    ],
  };
  const { records, pages, total } = await models.ResourceCategory.paginate(options);
  helpers.setPaginationHeaders(req, res, page, pages, total);
  res.json(records.map((r) => r.toJSON()));
});

// Create category
router.post('/', interceptors.requireAdmin, async (req, res) => {
  const payload = _.pick(req.body, ['name', 'link', 'position', 'CategoryId']);
  const record = models.ResourceCategory.build(payload);
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

// Show category
router.get('/:id', interceptors.requireLogin, async (req, res) => {
  try {
    const options = {
      include: [{ model: models.ResourceCategory, as: 'Children' }],
      order: [['position', 'ASC']],
      where: {},
    };
    if (req.params.id.match(/^[0-9]+$/)) {
      options.where.id = req.params.id;
    } else {
      options.where.link = req.params.id;
    }
    const record = await models.ResourceCategory.findOne(options);
    if (record) {
      res.json(record.toJSON());
    } else {
      res.status(StatusCodes.NOT_FOUND).end();
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
  }
});

// Update category
router.patch('/:id', interceptors.requireAdmin, async (req, res) => {
  let record;
  await models.sequelize.transaction(async (transaction) => {
    record = await models.ResourceCategory.findByPk(req.params.id, { transaction });
    if (record) {
      await record.update(_.pick(req.body, ['name', 'link', 'position', 'CategoryId']), { transaction });
    }
  });
  if (!record) {
    res.status(StatusCodes.NOT_FOUND).end();
  } else {
    res.json(record.toJSON());
  }
});

// Delete category
router.delete('/:id', interceptors.requireAdmin, async (req, res) => {
  let record;
  await models.sequelize.transaction(async (transaction) => {
    record = await models.ResourceCategory.findByPk(req.params.id, { transaction });
    if (record) {
      await record.destroy({ transaction });
    }
  });
  if (record) {
    res.status(StatusCodes.OK).end();
  } else {
    res.status(StatusCodes.NOT_FOUND).end();
  }
});

export default router;
