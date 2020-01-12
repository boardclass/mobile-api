'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface
      .createTable('agendas', {

        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        owner_id: {
          type: Sequelize.INTEGER,
          unique: true,
          allowNull: false,
          references: {
            model: 'establishments',
            key: 'id'
          },
          onUpdate: 'RESTRICT',
          onDelete: 'RESTRICT'
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

    return queryInterface.dropTable('agendas')

  }
};
