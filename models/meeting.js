const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Meeting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Meeting.belongsTo(models.MeetingTemplate);
      Meeting.hasMany(models.MeetingSubmission);
      Meeting.belongsTo(models.User, { as: 'CreatedByUser' });
      Meeting.belongsTo(models.User, { as: 'UpdatedByUser' });
    }
  }
  Meeting.init(
    {
      startsAt: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Date and time cannot be blank',
          },
          notEmpty: {
            msg: 'Date and time cannot be blank',
          },
        },
      },
      callLink: DataTypes.TEXT,
      callDetails: DataTypes.TEXT,
      topic: DataTypes.TEXT,
      maxUploadsCount: DataTypes.INTEGER,
      allowedUserIds: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: 'Meeting',
    }
  );
  return Meeting;
};
