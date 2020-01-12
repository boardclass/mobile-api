'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface
      .createTable('batteries', {

        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        establishment_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'establishments',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        address_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'establishment_addresses',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        professor_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'establishment_employees',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        sport_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'sports',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        start_hour: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        end_hour: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        session_seconds: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        session_value: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        people_allowed: {
          type: Sequelize.INT,
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

    return queryInterface.dropTable('batteries')

  }
};
