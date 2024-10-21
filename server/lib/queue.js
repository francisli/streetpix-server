import debug from 'debug';
import PgBoss from 'pg-boss';
import { Op } from 'sequelize';

const logger = debug('app:queue');

const COMMENTS_QUEUE = 'comments';
const COMMENTS_DEBOUNCE_INTERVAL = 5 /*min*/ * 60; /*sec/min*/

const boss = new PgBoss(
  process.env.NODE_ENV === 'test'
    ? `${process.env.DATABASE_URL}_test`
    : `${process.env.DATABASE_URL}${process.env.NODE_ENV === 'production' ? '?ssl=no-verify' : ''}`
);
boss.on('error', logger);

let models;

async function initialize() {
  ({ default: models } = await import('../models/index.js'));

  await boss.start();
  await boss.createQueue(COMMENTS_QUEUE, { policy: 'stately' });
  boss.work(COMMENTS_QUEUE, {}, commentNotificationHandler);
}

async function commentNotificationHandler(jobs) {
  if (jobs?.length > 0) {
    const [job] = jobs;
    const { commentId } = job?.data ?? {};
    if (commentId) {
      const comment = await models.Comment.findByPk(commentId);
      const comments = await models.Comment.findAll({
        include: [models.Photo, models.User],
        where: {
          createdAt: {
            [Op.gte]: comment.createdAt,
          },
        },
        order: [['createdAt', 'ASC']],
      });
      if (comments.length) {
        const lastComment = comments[comments.length - 1];
        const now = new Date();
        const dt = now.getTime() - lastComment.createdAt.getTime();
        if (dt < COMMENTS_DEBOUNCE_INTERVAL * 1000) {
          enqueueCommentNotification(commentId, COMMENTS_DEBOUNCE_INTERVAL - Math.ceil(dt / 1000));
        } else {
          await models.Comment.sendNotifications(comments);
        }
      }
    }
  }
}

async function enqueueCommentNotification(commentId, startAfter = COMMENTS_DEBOUNCE_INTERVAL) {
  const data = { commentId };
  return boss.send(COMMENTS_QUEUE, data, {
    singletonSeconds: startAfter,
    startAfter,
  });
}

async function stop() {
  return boss.stop();
}

export default {
  COMMENTS_QUEUE,
  initialize,
  enqueueCommentNotification,
  stop,
};
