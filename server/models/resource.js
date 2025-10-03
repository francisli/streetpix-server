import { Model } from 'sequelize';

export default function (sequelize, DataTypes) {
  class Resource extends Model {
    static associate(models) {
      Resource.belongsTo(models.ResourceCategory, { as: 'Category' });
      Resource.belongsTo(models.User);
    }
  }
  Resource.init(
    {
      name: DataTypes.TEXT,
      desc: DataTypes.TEXT,
      url: DataTypes.TEXT,
      file: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'Resource',
    }
  );

  Resource.afterSave(async (resource, options = {}) => {
    resource.handleAssetFile('file', options);
  });

  return Resource;
}
