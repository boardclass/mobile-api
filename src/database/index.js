const Sequelize = require('sequelize')
const { uri, define, dialect } = require('../config/mysql')

const User = require('../api/models/User')
const Account = require('../api/models/Account')
const Address = require('../api/models/Address')

const connection = new Sequelize(uri, {
    define: define,
    dialect: dialect
})

User.init(connection)   
Account.init(connection)
Address.init(connection)

User.associate(connection.models)
Address.associate(connection.models)
Account.associate(connection.models)

connection.authenticate()
    .then(() => {
        console.log(`Database connection has been established successfully on ${uri}`);
    })
    .catch(err => {
        console.error(`Unable to connect to the database: on ${uri}`, err);
    });

module.exports = connection