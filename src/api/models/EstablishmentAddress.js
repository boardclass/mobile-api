const { Model, DataTypes } = require('sequelize')

class EstablishmentAddress extends Model {
    static init(sequelize) {
        super.init({
            zipcode: DataTypes.STRING,
            country: DataTypes.STRING,
            state: DataTypes.STRING,
            city: DataTypes.STRING,
            neighbourhood: DataTypes.STRING,
            street: DataTypes.STRING,
            number: DataTypes.STRING,
            complement: DataTypes.STRING,
            type_id: DataTypes.INTEGER
        }, {
            sequelize
        })
    }

    static associate(models) {
        this.belongsTo(models.Establishment), { foreignKey: 'establishment_id', as: 'establishment'}
    }
}

module.exports = EstablishmentAddress