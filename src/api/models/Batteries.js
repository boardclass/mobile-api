const { Model, DataTypes } = require('sequelize')

class Batteries extends Model {
    static init(sequelize) {
        super.init({
            start_hour: DataTypes.TIME,
            end_hour: DataTypes.TIME,
            session_seconds: DataTypes.INTEGER,
            session_value: DataTypes.FLOAT,
            people_allowed: DataTypes.INTEGER
        }, {
            sequelize
        })
    }

    static associate(models) {
        this.belongsTo(models.Establishment, { foreignKey: 'establishment_id', as: 'establishment' })
        this.belongsTo(models.Sports, { foreignKey: 'sport_id', as: 'sports' })
        this.belongsTo(models.EstablishmentAddress, { foreignKey: 'address_id', as: 'service_address' })
    }
}

module.exports = Batteries