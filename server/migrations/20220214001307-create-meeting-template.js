module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MeetingTemplates', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      startsAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      latestAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      frequency: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      callLink: {
        type: Sequelize.TEXT,
      },
      callDetails: {
        type: Sequelize.TEXT,
      },
      topic: {
        type: Sequelize.TEXT,
      },
      maxUploadsCount: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 4,
      },
      allowedUserIds: {
        type: Sequelize.JSONB,
      },
      CreatedByUserId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'Users',
          },
          key: 'id',
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      UpdatedByUserId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'Users',
          },
          key: 'id',
        },
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MeetingTemplates');
  },
};
