module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MeetingSubmissions', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      MeetingId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: {
            tableName: 'Meetings',
          },
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      PhotoId: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: {
            tableName: 'Photos',
          },
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      position: {
        type: Sequelize.INTEGER,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.addIndex('MeetingSubmissions', {
      fields: ['PhotoId'],
      unique: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MeetingSubmissions');
  },
};
