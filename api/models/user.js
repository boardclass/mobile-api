const mongoose = require('mongoose')
const addressSchema = require('./address')
const accountSchema = require('./account')

const UserSchema = new mongoose.Schema({

    cpf: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: false
    },
    birthday: {
        type: Date,
        required: false
    },
    phone: {
        type: String,
        unique: true,
        required: true
    },
    registerDate: {
        type: Date,
        default: Date.now()
    },
    address: addressSchema.model,
    account: accountSchema.model

}, {collection: 'users'})

mongoose.model('User', UserSchema)

module.exports = {
    model: UserSchema
}