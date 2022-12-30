'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Versions', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
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
      },
      file: {
        type: Sequelize.TEXT,
      },
      filename: {
        type: Sequelize.TEXT,
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Versions');
  },
};
