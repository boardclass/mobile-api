const { Model, DataTypes } = require('sequelize')

class User extends Model {
    static init(sequelize) {
        super.init({
            cpf: DataTypes.STRING,
            name: DataTypes.STRING,
            phone: DataTypes.STRING 
        }, {
            sequelize   
        })
    }
    
    static associate(models) {
        this.hasOne(models.UserAccount, { foreignKey: 'user_id', as: 'account' })
        this.hasMany(models.UserAddress, { foreignKey: 'user_id', as: 'addresses' })
        this.hasMany(models.UsersRoles, { foreignKey: 'user_id', as: 'roles' })
        this.hasMany(models.EstablishmentEmployees, { foreignKey: 'user_id', as: 'employees' })
    }
}

module.exports = User