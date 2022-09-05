const _ = require('lodash');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Feature extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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
};
