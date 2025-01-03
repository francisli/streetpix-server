import express from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import { Op } from 'sequelize';

import helpers from '../helpers.js';
import models from '../../models/index.js';
import interceptors from '../interceptors.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const options = {
    page: req.query.page || '1',
    paginate: 12,
    include: [{ model: models.User, where: { deactivatedAt: null } }],
    where: {},
    order: [
      ['createdAt', 'DESC'],
      ['filename', 'ASC'],
    ],
  };
  if (!req.user || req.query.year) {
    options.include.push({ model: models.Feature, required: true });
    if (req.query.year && req.query.year !== '') {
      options.where['$Feature.year$'] = req.query.year;
      options.order.unshift([models.Feature, 'position', 'ASC']);
    }
  } else if (req.user && req.query.sort) {
    switch (req.query.sort) {
      case 'meeting':
        options.include.push({ model: models.MeetingSubmission, include: models.Meeting });
        options.order = [
          [models.MeetingSubmission, models.Meeting, 'startsAt', 'DESC'],
          [models.MeetingSubmission, 'createdAt', 'DESC'],
        ];
        break;
      case 'takenAt':
        options.order[0] = ['takenAt', 'DESC'];
        options.where.takenAt = {
          [Op.ne]: null,
        };
        break;
      case 'rating':
        options.order[0] = ['rating', 'DESC'];
        options.where.rating = {
          [Op.gt]: 0,
        };
        break;
      case 'myRating':
        options.include.push({ model: models.Rating, where: { UserId: req.user.id } });
        options.order.unshift([models.Rating, 'value', 'DESC']);
        break;
      default:
        break;
    }
  }
  if (req.query.userId && req.query.userId !== '') {
    if (req.query.userId.match(/^[0-9]+$/)) {
      options.include[0].where.id = req.query.userId;
    } else {
      options.include[0].where.username = req.query.userId;
    }
  }
  const { records, pages, total } = await models.Photo.paginate(options);
  helpers.setPaginationHeaders(req, res, options.page, pages, total);
  res.json(
    records.map((record) => {
      const json = record.toJSON();
      if (req.user) {
        json.rating = record.rating;
      }
      return json;
    })
  );
});

router.post('/', interceptors.requireLogin, async (req, res) => {
  const doc = models.Photo.build(_.pick(req.body, ['filename', 'file', 'caption', 'description', 'license', 'acquireLicensePage']));
  doc.UserId = req.user.id;
  try {
    await doc.save();
    res.status(StatusCodes.CREATED).json(doc.toJSON());
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

router.get('/random', async (req, res) => {
  try {
    const [results] = await models.sequelize.query(`
      SELECT DISTINCT ON ("Users".id) "Users".id AS "UserId", "Photos".id AS "PhotoId", "Features".id AS "FeatureId"
      FROM "Users"
      JOIN "Photos" ON "Users".id="Photos"."UserId"
      JOIN "Features" ON "Features"."PhotoId"="Photos".id
      WHERE "Users"."deactivatedAt" IS NULL
      AND "Users"."isPublic"=TRUE
      ORDER BY "Users".id, RANDOM()`);
    const photos = await models.Photo.findAll({
      where: {
        id: results.map((r) => r.PhotoId),
      },
      include: [models.Feature, models.User],
      order: models.Sequelize.literal('RANDOM()'),
    });
    res.json(photos.map((p) => p.toJSON()));
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
  }
});

router.get('/:id', async (req, res) => {
  try {
    const photo = await models.Photo.findByPk(req.params.id, {
      include: [{ model: models.Comment, include: [models.User] }, models.Feature, models.Rating, models.User],
      order: [[models.Comment, 'createdAt', 'ASC']],
    });
    if (photo) {
      const json = photo.toJSON();
      if (req.user) {
        json.rating = photo.rating;
        json.metadata = photo.metadata;
        if (req.user.id === photo.UserId) {
          json.notes = photo.notes;
        }
      } else {
        json.Ratings = [];
      }
      res.json(json);
    } else {
      res.status(StatusCodes.NOT_FOUND).end();
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
  }
});

router.patch('/:id', interceptors.requireLogin, async (req, res) => {
  let doc;
  try {
    await models.sequelize.transaction(async (transaction) => {
      doc = await models.Photo.findByPk(req.params.id, {
        include: [{ model: models.Comment, include: [models.User] }, models.Feature, models.Rating, models.User],
        order: [[models.Comment, 'createdAt', 'ASC']],
        transaction,
      });
      if (!doc) {
        res.status(StatusCodes.NOT_FOUND).end();
        return;
      }
      if (!req.user.isAdmin && req.user.id !== doc.UserId) {
        res.status(StatusCodes.UNAUTHORIZED).end();
        return;
      }
      await doc.update(_.pick(req.body, ['caption', 'description', 'notes', 'license', 'acquireLicensePage']), { transaction });
    });
    res.json(doc.toJSON());
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

router.post('/:id/feature', interceptors.requireLogin, async (req, res) => {
  let feature;
  try {
    await models.sequelize.transaction(async (transaction) => {
      const photo = await models.Photo.findByPk(req.params.id, {
        transaction,
      });
      if (!photo) {
        res.status(StatusCodes.NOT_FOUND).end();
        return;
      }
      if (!req.user.isAdmin && req.user.id !== photo.UserId) {
        res.status(StatusCodes.UNAUTHORIZED).end();
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
          res.status(StatusCodes.UNPROCESSABLE_ENTITY).end();
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
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        status: StatusCodes.UNPROCESSABLE_ENTITY,
        errors: error.errors,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
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
        res.status(StatusCodes.NOT_FOUND).end();
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
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        status: StatusCodes.UNPROCESSABLE_ENTITY,
        errors: error.errors,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    }
  }
});

router.delete('/:id', interceptors.requireLogin, async (req, res) => {
  await models.sequelize.transaction(async (transaction) => {
    const photo = await models.Photo.findByPk(req.params.id, { transaction });
    if (!photo) {
      res.status(StatusCodes.NOT_FOUND).end();
      return;
    }
    if (!req.user.isAdmin && req.user.id !== photo.UserId) {
      res.status(StatusCodes.UNAUTHORIZED).end();
      return;
    }
    await photo.destroy({ transaction });
    res.status(StatusCodes.OK).end();
  });
});

export default router;
