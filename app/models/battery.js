const database = require('../../setup/database')
const addressSchema = require('./address')
const scheduleSessionSchema = require('./schedule-session')

const BatterySchema = new database.Schema({

    startHour: Number,
    finishHour: Number,
    amountClient: Number,
    session: scheduleSessionSchema.model,
    address: addressSchema.model

}, { collection: 'batteries' })

module.exports = {
    model: BatterySchema
}