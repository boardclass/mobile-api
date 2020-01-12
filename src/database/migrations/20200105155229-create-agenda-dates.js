'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface
      .createTable('agenda_dates', {

        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        agenda_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'agendas',
            key: 'id'
          },
          onUpdate: 'RESTRICT',
          onDelete: 'RESTRICT'
        },
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        status_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'agenda_status',
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

    return queryInterface.dropTable('agenda_dates')

  }
};
