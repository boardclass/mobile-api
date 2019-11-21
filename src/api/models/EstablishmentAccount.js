const { Model, DataTypes } = require('sequelize')

class EstablishmentAccount extends Model {
    static init(sequelize) {
        super.init({
            email: DataTypes.STRING,
            password: DataTypes.STRING 
        }, {
            sequelize   
        })
    }
    
    static associate(models) {
        this.belongsTo(models.Establishment), { foreignKey: 'establishment_id', as: 'establishment'}
    } 
}

module.exports = EstablishmentAccount