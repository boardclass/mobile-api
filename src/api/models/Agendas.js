const { Model, DataTypes } = require('sequelize')

class Agendas extends Model {
    static init(sequelize) {
        super.init({
            
        }, {
            sequelize
        })
    }

    static associate(models) {
        this.hasMany(models.AgendaDates, { foreignKey: 'agenda_id', as: 'agenda' })
    }
}

module.exports = Agendas