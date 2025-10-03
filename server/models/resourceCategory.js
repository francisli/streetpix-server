import { Model } from 'sequelize';

export default function (sequelize, DataTypes) {
  class ResourceCategory extends Model {
    static associate(models) {
      ResourceCategory.belongsTo(models.ResourceCategory, { as: 'Parent', foreignKey: 'CategoryId' });
      ResourceCategory.hasMany(models.ResourceCategory, { as: 'Children', foreignKey: 'CategoryId' });
      ResourceCategory.hasMany(models.Resource, { as: 'Resources', foreignKey: 'CategoryId' });
    }
  }
  ResourceCategory.init(
    {
      name: DataTypes.TEXT,
      link: DataTypes.TEXT,
      position: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'ResourceCategory',
    }
  );
  return ResourceCategory;
}
