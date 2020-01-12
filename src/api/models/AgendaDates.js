const { Model, DataTypes } = require('sequelize')

class AgendaDates extends Model {
    static init(sequelize) {
        super.init({
            date: DataTypes.DATEONLY
        }, {
            sequelize
        })
    }

    static associate(models) {
        this.hasOne(models.AgendaStatus, { foreignKey: 'status_id', as: 'status' })
    }
}

module.exports = AgendaDates