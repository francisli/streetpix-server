const express = require('express');
const HttpStatus = require('http-status-codes');
const _ = require('lodash');

const models = require('../../models');
const interceptors = require('../interceptors');
const helpers = require('../helpers');

const router = express.Router();

router.get('/', async (req, res) => {
  const options = {
    page: req.query.page || '1',
    paginate: 12,
    include: models.User,
    order: [
      ['createdAt', 'DESC'],
      ['caption', 'ASC'],
    ],
  };
  if (!req.user) {
    options.where = {
      isPublic: true,
    };
  }
  if (req.query.userId && req.query.userId !== '') {
    options.where = options.where || {};
    if (req.query.userId.match(/[0-9]+/)) {
      options.where.UserId = req.query.userId;
    } else {
      options.where['$User.username$'] = req.query.userId;
    }
  }
  const { records, pages, total } = await models.Photo.paginate(options);
  helpers.setPaginationHeaders(req, res, options.page, pages, total);
  res.json(records.map((record) => record.toJSON()));
});

router.post('/', interceptors.requireLogin, async (req, res) => {
  const doc = models.Photo.build(
    _.pick(req.body, ['filename', 'file', 'caption', 'description', 'isPublic', 'license', 'acquireLicensePage'])
  );
  doc.UserId = req.user.id;
  try {
    await doc.save();
    res.status(HttpStatus.CREATED).json(doc.toJSON());
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

router.get('/random', async (req, res) => {
  try {
    const photos = await models.Photo.findAll({
      include: models.User,
      where: {
        isPublic: true,
      },
      order: models.Sequelize.literal('RANDOM()'),
      limit: 1,
    });
    if (photos.length > 0) {
      res.json(photos[0].toJSON());
    } else {
      res.status(HttpStatus.NO_CONTENT).end();
    }
  } catch (error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await models.Photo.findByPk(req.params.id, {
      include: [models.Rating, models.User],
    });
    if (doc) {
      res.json(doc.toJSON());
    } else {
      res.status(HttpStatus.NOT_FOUND).end();
    }
  } catch (error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
  }
});

router.patch('/:id', interceptors.requireLogin, async (req, res) => {
  let doc;
  try {
    await models.sequelize.transaction(async (transaction) => {
      doc = await models.Photo.findByPk(req.params.id, {
        include: [models.Rating, models.User],
        transaction,
      });
      if (!doc) {
        res.status(HttpStatus.NOT_FOUND).end();
        return;
      }
      if (!req.user.isAdmin && req.user.id !== doc.UserId) {
        res.status(HttpStatus.UNAUTHORIZED).end();
        return;
      }
      await doc.update(_.pick(req.body, ['caption', 'description', 'isPublic', 'license', 'acquireLicensePage']), { transaction });
    });
    res.json(doc.toJSON());
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

router.post('/:id/rate', interceptors.requireLogin, async (req, res) => {
  let rating;
  let created;
  try {
    await models.sequelize.transaction(async (transaction) => {
      const photo = await models.Photo.findByPk(req.params.id, {
        include: models.User,
        transaction,
      });
      if (!photo) {
        res.status(HttpStatus.NOT_FOUND).end();
        return;
      }
      if (req.user.id === photo.UserId) {
        res.status(HttpStatus.UNAUTHORIZED).end();
        return;
      }
      [rating, created] = await models.Rating.findOrCreate({
        where: {
          PhotoId: photo.id,
          UserId: req.user.id,
        },
        defaults: {
          value: req.body.value,
        },
        transaction,
      });
      if (req.body.value === 0) {
        await rating.destroy();
      } else if (!created) {
        await rating.update({ value: req.body.value }, { transaction });
      }
    });
    res.json(rating.toJSON());
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

router.delete('/:id', interceptors.requireLogin, async (req, res) => {
  await models.sequelize.transaction(async (transaction) => {
    const photo = await models.Photo.findByPk(req.params.id, { transaction });
    if (!photo) {
      res.status(HttpStatus.NOT_FOUND).end();
      return;
    }
    if (!req.user.isAdmin && req.user.id !== photo.UserId) {
      res.status(HttpStatus.UNAUTHORIZED).end();
      return;
    }
    await photo.destroy({ transaction });
    res.status(HttpStatus.OK).end();
  });
});

module.exports = router;
