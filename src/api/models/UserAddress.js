const { Model, DataTypes } = require('sequelize')

class UserAddress extends Model {
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
        }, {
            sequelize
        })
    }

    static associate(models) {
        this.belongsTo(models.UserAddress), { foreignKey: 'user_id', as: 'user'}
    }
}

module.exports = UserAddress