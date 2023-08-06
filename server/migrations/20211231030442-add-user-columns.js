module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Users', 'username', { type: Sequelize.CITEXT, unique: true }, { transaction });
      await queryInterface.addColumn(
        'Users',
        'isPublic',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction }
      );
      await queryInterface.addColumn('Users', 'phone', Sequelize.STRING, { transaction });
      await queryInterface.addColumn('Users', 'bio', Sequelize.TEXT, { transaction });
      await queryInterface.addColumn('Users', 'website', Sequelize.TEXT, { transaction });
      await queryInterface.addColumn(
        'Users',
        'license',
        { type: Sequelize.TEXT, allowNull: false, defaultValue: 'allrightsreserved' },
        { transaction }
      );
      await queryInterface.addColumn('Users', 'acquireLicensePage', Sequelize.TEXT, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Users', 'acquireLicensePage', { transaction });
      await queryInterface.removeColumn('Users', 'license', { transaction });
      await queryInterface.removeColumn('Users', 'website', { transaction });
      await queryInterface.removeColumn('Users', 'bio', { transaction });
      await queryInterface.removeColumn('Users', 'phone', { transaction });
      await queryInterface.removeColumn('Users', 'isPublic', { transaction });
      await queryInterface.removeColumn('Users', 'username', { transaction });
    });
  },
};
