const { Model, DataTypes } = require('sequelize')

class Sports extends Model {
    static init(sequelize) {
        super.init({
            name: DataTypes.STRING,
            display_name: DataTypes.STRING
        }, {
            sequelize
        })
    }

    static associate(models) {
        this.hasMany(models.Batteries, { foreignKey: 'sport_id', as: 'batteries' })
    }
}

module.exports = Sports