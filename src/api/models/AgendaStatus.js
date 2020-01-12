const { Model, DataTypes } = require('sequelize')

class AgendaStatus extends Model {
    static init(sequelize) {
        super.init({
            name: DataTypes.STRING,
            display_name: DataTypes.STRING,
            reason: DataTypes.STRING
        }, {
            sequelize,
            tableName: 'agenda_status'
        })
    }

    static associate(models) {
        this.belongsTo(models.AgendaDates, { foreignKey: 'status_id', as: 'status' })
    }
}

module.exports = AgendaStatus