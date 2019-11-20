'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface
      .createTable('establishments', {

        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        parent_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'establishments',
            key: 'id'
          },
          onUpdate: 'RESTRICT',
          onDelete: 'RESTRICT'
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        cnpj: {
          type: Sequelize.STRING,
          allowNull: true,
          validate: {
            len: 14
          }
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

    return queryInterface.dropTable('establishments')

  }
};
