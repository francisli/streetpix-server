import { Model } from 'sequelize';

export default function (sequelize, DataTypes) {
  class MeetingSubmission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      MeetingSubmission.belongsTo(models.Meeting);
      MeetingSubmission.belongsTo(models.Photo);
    }
  }
  MeetingSubmission.init(
    {
      position: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'MeetingSubmission',
    }
  );
  return MeetingSubmission;
}
