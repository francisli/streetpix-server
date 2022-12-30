'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Version extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Version.belongsTo(models.Photo);
    }
  }
  Version.init(
    {
      file: DataTypes.TEXT,
      filename: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'Version',
    }
  );
  return Version;
};
