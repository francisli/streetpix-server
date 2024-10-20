import _ from 'lodash';
import { Model } from 'sequelize';
import { DateTime } from 'luxon';

import queue from '../lib/queue.js';
import mailer from '../emails/mailer.js';

export default function (sequelize, DataTypes) {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.Photo);
      Comment.belongsTo(models.User);
    }

    static async sendNotifications(comments) {
      const users = await sequelize.models.User.scope('active').findAll();
      const to = users.map((u) => u.fullNameAndEmail).join(', ');
      return mailer.send({
        template: 'comments',
        message: {
          to,
        },
        locals: {
          comments,
          DateTime,
        },
      });
    }

    toJSON() {
      const json = _.pick(this.get(), ['id', 'PhotoId', 'UserId', 'body', 'createdAt', 'updatedAt']);
      if (this.Photo) {
        json.Photo = this.Photo.toJSON();
      }
      if (this.User) {
        json.User = this.User.toJSON();
      }
      return json;
    }
  }

  Comment.init(
    {
      body: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'Comment',
    }
  );

  Comment.afterCreate(async (comment) => {
    return queue.enqueueCommentNotification(comment.id);
  });

  return Comment;
}
