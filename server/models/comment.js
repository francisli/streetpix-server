import _ from 'lodash';
import { Model } from 'sequelize';

export default function (sequelize, DataTypes) {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.Photo);
      Comment.belongsTo(models.User);
    }

    toJSON() {
      const json = _.pick(this.get(), ['id', 'PhotoId', 'UserId', 'body', 'createdAt', 'updatedAt']);
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
  return Comment;
}
