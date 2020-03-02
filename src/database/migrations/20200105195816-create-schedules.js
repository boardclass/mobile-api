'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface
      .createTable('schedules', {

        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        battery_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'batteries',
            key: 'id'
          },
          onUpdate: 'RESTRICT',
          onDelete: 'RESTRICT'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'RESTRICT',
          onDelete: 'RESTRICT'
        },
        agenda_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'agenda_dates',
            key: 'id'
          },
          onUpdate: 'RESTRICT',
          onDelete: 'RESTRICT'
        },
        status_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'schedule_status',
            key: 'id'
          },
          onUpdate: 'RESTRICT',
          onDelete: 'RESTRICT'
        },
        start_hour: {
          type: Sequelize.TIME,
          allowNull: true
        },
        end_hour: {
          type: Sequelize.TIME,
          allowNull: true
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

    return queryInterface.dropTable('schedules')

  }
};
