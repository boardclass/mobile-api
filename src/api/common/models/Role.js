const { Model, DataTypes } = require('sequelize')

class Role extends Model {
    static init(sequelize) {
        super.init({}, { sequelize })
    }

    static associate(models) {
        this.hasMany(models.UsersRoles, { foreignKey: 'role_id', as: 'roles' })
    }
}

module.exports = Role