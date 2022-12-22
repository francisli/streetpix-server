const express = require('express');
const HttpStatus = require('http-status-codes');
const _ = require('lodash');

const models = require('../../models');
const interceptors = require('../interceptors');
const helpers = require('../helpers');

const router = express.Router();

router.get('/', async (req, res) => {
  const page = req.query.page || 1;
  const options = {
    page,
    where: {
      deactivatedAt: null,
    },
    order: [
      ['lastName', 'ASC'],
      ['firstName', 'ASC'],
      ['email', 'ASC'],
    ],
  };
  if (!req.user) {
    options.where.isPublic = true;
  } else if (req.user?.isAdmin && req.query.showAll) {
    delete options.where.deactivatedAt;
  }
  const { records, pages, total } = await models.User.paginate(options);
  helpers.setPaginationHeaders(req, res, page, pages, total);
  res.json(records.map((r) => r.toJSON()));
});

router.get('/me', (req, res) => {
  if (req.user) {
    res.json(req.user.toJSON());
  } else {
    res.status(HttpStatus.NO_CONTENT).end();
  }
});

router.get('/:id', async (req, res) => {
  try {
    let user;
    if (req.params.id.match(/^[0-9]+$/)) {
      user = await models.User.findByPk(req.params.id);
    } else {
      user = await models.User.findOne({ where: { username: req.params.id } });
    }
    if (user) {
      res.json(user.toJSON());
    } else {
      res.status(HttpStatus.NOT_FOUND).end();
    }
  } catch (error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
  }
});

router.patch('/:id', interceptors.requireLogin, (req, res) => {
  if (!req.user.isAdmin && req.user.id !== parseInt(req.params.id, 10)) {
    res.status(HttpStatus.UNAUTHORIZED).end();
    return;
  }
  models.sequelize.transaction(async (transaction) => {
    try {
      const user = await models.User.findByPk(req.params.id, { transaction });
      if (!user) {
        res.status(HttpStatus.NOT_FOUND).end();
        return;
      }
      const fields = [
        'firstName',
        'lastName',
        'username',
        'email',
        'password',
        'confirmPassword',
        'picture',
        'bio',
        'website',
        'license',
        'acquireLicensePage',
        'isPublic',
      ];
      if (req.user.isAdmin) {
        fields.push('isAdmin');
      }
      await user.update(_.pick(req.body, fields), { transaction });
      res.json(user.toJSON());
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
});

router.delete('/:id', interceptors.requireAdmin, async (req, res) => {
  let user;
  await models.sequelize.transaction(async (transaction) => {
    try {
      user = await models.User.findByPk(req.params.id, { transaction });
      if (!user) {
        res.status(HttpStatus.NOT_FOUND).end();
        return;
      }
      const { deactivatedAt } = user;
      await user.update({ deactivatedAt: deactivatedAt ? null : new Date() }, { transaction });
    } catch (error) {
      user = null;
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
  if (user) {
    res.status(HttpStatus.OK).end();
  }
});

module.exports = router;
