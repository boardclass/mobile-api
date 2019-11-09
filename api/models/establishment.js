const mongoose = require('mongoose')
const addressScheme = require('./address')
const scheduleScheme = require('./schedule')
const accountSchema = require('./account')

const EstablishmentSchema = new mongoose.Schema({
 
    name: String,
    cnpj: {
        type: String,
        required: true
    },
    account: accountSchema.model,
    address: {
        type: addressScheme.model,
        required: true
    },
    attendanceAddresses: [addressScheme.model],
    schedule: scheduleScheme.model,
    registerDate: {
        type: Date,
        default: Date.now()
    }

}, { collection: 'establishments' })

mongoose.model('establishment', EstablishmentSchema)