const { Model, DataTypes } = require('sequelize')

class UsersRoles extends Model {
    static init(sequelize) {
        super.init({}, { sequelize })
    }

    static associate(models) {
        this.belongsTo(models.User), { foreignKey: 'user_id', as: 'users' }
        this.belongsTo(models.Role), { foreignKey: 'role_id', as: 'roles' }
    }
}

module.exports = UsersRoles