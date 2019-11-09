const mongoose = require('mongoose')

const AccountSchema = new mongoose.Schema({

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