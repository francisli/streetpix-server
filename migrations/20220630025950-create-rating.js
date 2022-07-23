module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Ratings', {
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
        onDelete: 'CASCADE',
      },
      UserId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: {
            tableName: 'Users',
          },
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      value: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 1,
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
    await queryInterface.addIndex('Ratings', {
      fields: ['PhotoId', 'UserId'],
      unique: true,
    });
    await queryInterface.addColumn('Photos', 'rating', { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Photos', 'rating');
    await queryInterface.dropTable('Ratings');
  },
};
