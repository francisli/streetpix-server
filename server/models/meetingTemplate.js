import { Model } from 'sequelize';

export default function (sequelize, DataTypes) {
  class MeetingTemplate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      MeetingTemplate.belongsTo(models.User, { as: 'CreatedByUser' });
      MeetingTemplate.belongsTo(models.User, { as: 'UpdatedByUser' });
    }
  }
  MeetingTemplate.init(
    {
      startsAt: DataTypes.DATE,
      latestAt: DataTypes.DATE,
      frequency: DataTypes.INTEGER,
      callLink: DataTypes.TEXT,
      callDetails: DataTypes.TEXT,
      topic: DataTypes.TEXT,
      maxUploadsCount: DataTypes.INTEGER,
      allowedUserIds: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: 'MeetingTemplate',
    }
  );
  return MeetingTemplate;
}
