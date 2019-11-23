const { Model, DataTypes } = require('sequelize')

class Establishment extends Model {
    static init(sequelize) {
        super.init({
            name: DataTypes.STRING,
            cnpj: DataTypes.STRING
        }, {
            sequelize
        })
    }

    static associate(models) {
        this.hasOne(models.EstablishmentAccount, { foreignKey: 'establishment_id', as: 'account' })
        this.hasMany(models.EstablishmentEmployees, { foreignKey: 'user_id', as: 'users' })
        this.hasMany(models.EstablishmentAddress, { foreignKey: 'establishment_id', as: 'addresses' })
    }
}

module.exports = Establishment