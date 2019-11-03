const database = require('../../setup/database')
const addressScheme = require('./address')
const scheduleScheme = require('./schedule')
const batteryScheme = require('./battery')
const scheduleSessionSchema = require('./schedule-session')
const accountSchema = require('./account')

const EstablishmentSchema = new database.Schema({

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
    attendanceAddress: addressScheme.model,
    schedule: scheduleScheme.model,
    batteries: [batteryScheme.model],
    session: scheduleSessionSchema.model,
    registerDate: {
        type: Date,
        default: Date.now()
    }

}, { collection: 'establishments' })

database.mongoose.model('establishment', EstablishmentSchema)