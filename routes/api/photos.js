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
      ['filename', 'ASC'],
    ],
  };
  if (!req.user || req.query.year) {
    options.include = [models.User, { model: models.Feature, required: true }];
    if (req.query.year && req.query.year !== '') {
      options.where = options.where || {};
      options.where['$Feature.year$'] = req.query.year;
      options.order.unshift([models.Feature, 'position', 'ASC']);
    }
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
  const doc = models.Photo.build(_.pick(req.body, ['filename', 'file', 'caption', 'description', 'license', 'acquireLicensePage']));
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
      include: [
        { model: models.Feature, required: true },
        { model: models.User, where: { isPublic: true } },
      ],
      order: models.Sequelize.literal('RANDOM()'),
      limit: 12,
    });
    res.json(photos.map((p) => p.toJSON()));
  } catch (error) {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).end();
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doc = await models.Photo.findByPk(req.params.id, {
      include: [models.Feature, models.Rating, models.User],
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
      await doc.update(_.pick(req.body, ['caption', 'description', 'license', 'acquireLicensePage']), { transaction });
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

router.post('/:id/feature', interceptors.requireLogin, async (req, res) => {
  let feature;
  try {
    await models.sequelize.transaction(async (transaction) => {
      const photo = await models.Photo.findByPk(req.params.id, {
        transaction,
      });
      if (!photo) {
        res.status(HttpStatus.NOT_FOUND).end();
        return;
      }
      if (!req.user.isAdmin && req.user.id !== photo.UserId) {
        res.status(HttpStatus.UNAUTHORIZED).end();
        return;
      }
      const year = parseInt(req.body.year, 10);
      feature = await photo.getFeature({ transaction });
      if (feature && Number.isNaN(year)) {
        await feature.destroy();
      } else if (feature && feature.year === year) {
        const position = parseInt(req.body.position, 10);
        if (position && feature.position !== position) {
          const dir = position > feature.position ? 'ASC' : 'DESC';
          await feature.update({ position }, { transaction });
          const features = await req.user.getFeatures({
            where: { year },
            order: [
              ['position', 'ASC'],
              ['updatedAt', dir],
            ],
            transaction,
          });
          await Promise.all(
            _.compact(
              features.map((f, i) => {
                if (f.position !== i + 1) {
                  return f.update({ position: i + 1 }, { transaction });
                }
                return null;
              })
            )
          );
        }
      } else {
        const features = await req.user.getFeatures({
          where: { year },
          order: [['position', 'ASC']],
          transaction,
        });
        if (features.length >= 12) {
          res.status(HttpStatus.UNPROCESSABLE_ENTITY).end();
          return;
        }
        if (feature) {
          await feature.update({
            year,
            position: features.length + 1,
          });
        } else {
          feature = await models.Feature.create(
            {
              UserId: req.user.id,
              PhotoId: photo.id,
              year,
              position: features.length + 1,
            },
            { transaction }
          );
        }
      }
    });
    res.json(feature.toJSON());
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
        transaction,
      });
      if (!photo) {
        res.status(HttpStatus.NOT_FOUND).end();
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
