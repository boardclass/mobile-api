const Sequelize = require('sequelize')
const { uri, define, dialect } = require('../config/mysql')

const User = require('../api/models/User')
const UserAccount = require('../api/models/UserAccount')
const UserAddress = require('../api/models/UserAddress')
const Establishment = require('../api/models/Establishment')
const EstablishmentAccount = require('../api/models/EstablishmentAccount')
const EstablishmentAddress = require('../api/models/EstablishmentAddress')
const EstablishmentEmployees = require('../api/models/EstablishmentEmployees')

const connection = new Sequelize(uri, {
    define: define,
    dialect: dialect
})

User.init(connection)   
UserAccount.init(connection)
UserAddress.init(connection)
Establishment.init(connection)
EstablishmentAccount.init(connection)
EstablishmentAddress.init(connection)
EstablishmentEmployees.init(connection)

User.associate(connection.models)
UserAddress.associate(connection.models)
UserAccount.associate(connection.models)
Establishment.associate(connection.models)
EstablishmentAccount.associate(connection.models)
EstablishmentAddress.associate(connection.models)
EstablishmentEmployees.associate(connection.models)

connection.authenticate()
    .then(() => {
        console.log(`Database connection has been established successfully on ${uri}`);
    })
    .catch(err => {
        console.error(`Unable to connect to the database: on ${uri}`, err);
    });

module.exports = connection