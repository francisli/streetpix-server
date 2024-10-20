import _ from 'lodash';
import { Model } from 'sequelize';

export default function (sequelize, DataTypes) {
  class Feature extends Model {
    static associate(models) {
      Feature.belongsTo(models.User);
      Feature.belongsTo(models.Photo);
    }

    toJSON() {
      return _.pick(this.get(), ['PhotoId', 'year', 'position']);
    }
  }
  Feature.init(
    {
      year: DataTypes.INTEGER,
      position: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Feature',
    }
  );
  return Feature;
}
