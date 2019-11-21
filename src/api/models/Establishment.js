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
        this.hasMany(models.EstablishmentEmployees, { foreignKey: 'user_id', as: 'user' })
    } 
}

module.exports = Establishment