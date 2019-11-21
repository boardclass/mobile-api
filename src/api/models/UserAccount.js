const { Model, DataTypes } = require('sequelize')

class UserAccount extends Model {
    static init(sequelize) {
        super.init({
            email: DataTypes.STRING,
            password: DataTypes.STRING
        }, {
            sequelize
        })
    }

    static associate(models) {
        this.belongsTo(models.User), { foreignKey: 'user_id', as: 'user'}
    }
}

module.exports = UserAccount