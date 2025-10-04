import { Model } from 'sequelize';

export default function (sequelize, DataTypes) {
  class ResourceCategory extends Model {
    static associate(models) {
      ResourceCategory.belongsTo(models.User);
      ResourceCategory.belongsTo(models.ResourceCategory, { as: 'Parent', foreignKey: 'CategoryId' });
      ResourceCategory.hasMany(models.ResourceCategory, { as: 'Children', foreignKey: 'CategoryId' });
      ResourceCategory.hasMany(models.Resource, { as: 'Resources', foreignKey: 'CategoryId' });
    }
  }
  ResourceCategory.init(
    {
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      link: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      sequelize,
      modelName: 'ResourceCategory',
    }
  );
  return ResourceCategory;
}
