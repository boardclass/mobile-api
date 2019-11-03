const database = require('../../setup/database')

const AccountSchema = new database.Schema({

    role: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    authenticationToken: String,
    sessionToken: String,
    verification: {
        code: String,
        expiration: Date
    }

}, { collection: 'accounts' })

module.exports = {
    model: AccountSchema
}