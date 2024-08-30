import _ from 'lodash';
import { Model } from 'sequelize';

export default function (sequelize, DataTypes) {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.Photo);
      Comment.belongsTo(models.User);
    }

    toJSON() {
      return _.pick(this.get(), ['id', 'PhotoId', 'UserId', 'body', 'createdAt', 'updatedAt']);
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
  return Comment;
}
