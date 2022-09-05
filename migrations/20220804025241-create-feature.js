module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Features', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      year: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      position: {
        allowNull: false,
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
    await queryInterface.addIndex('Features', {
      fields: ['PhotoId'],
      unique: true,
    });
    // set starting id to larger value so it doesn't conflict with test fixtures
    await queryInterface.sequelize.query('ALTER SEQUENCE "Features_id_seq" RESTART WITH 100;');
    await queryInterface.removeColumn('Photos', 'isPublic');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Photos', 'isPublic', {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.dropTable('Features');
  },
};
