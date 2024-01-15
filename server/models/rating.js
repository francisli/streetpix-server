import { Model } from 'sequelize';

export default function (sequelize, DataTypes) {
  class Rating extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Rating.belongsTo(models.Photo);
      Rating.belongsTo(models.User);
    }
  }
  Rating.init(
    {
      value: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Rating',
    }
  );
  Rating.afterSave(async (rating, options = {}) => {
    const { transaction } = options;
    const photo = rating.Photo || (await rating.getPhoto({ transaction }));
    await photo.updateRating({ transaction });
  });
  Rating.afterDestroy(async (rating, options = {}) => {
    const { transaction } = options;
    const photo = rating.Photo || (await rating.getPhoto({ transaction }));
    await photo.updateRating({ transaction });
  });
  return Rating;
}
