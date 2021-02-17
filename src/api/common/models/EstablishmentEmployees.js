const { Model, DataTypes } = require('sequelize')

class EstablishmentEmployees extends Model {
    static init(sequelize) {
        super.init({
            name: DataTypes.STRING,
            cnpj: DataTypes.STRING 
        }, {
            sequelize   
        })
    }
    
    static associate(models) {
        this.belongsTo(models.User), { foreignKey: 'user_id', as: 'user'}
        this.belongsTo(models.Establishment), { foreignKey: 'establishment_id', as: 'establishment'}
    } 
}

module.exports = EstablishmentEmployees