'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface
      .createTable('user_accounts', {

        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        user_id: {
          type: Sequelize.INTEGER,
          unique: true,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'RESTRICT',
          onDelete: 'RESTRICT'
        },
        email: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }

      })

  },

  down: (queryInterface, Sequelize) => {

    return queryInterface.dropTable('user_accounts')

  }
};
