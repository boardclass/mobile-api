const { Model, DataTypes } = require('sequelize')

class Batteries extends Model {
    static init(sequelize) {
        super.init({
            start_hour: DataTypes.INTEGER,
            end_hour: DataTypes.INTEGER,
            session_seconds: DataTypes.INTEGER,
            session_value: DataTypes.FLOAT
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