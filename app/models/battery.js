const database = require('../../setup/database')
const schedulesScheme = require('./schedules')

const BatterySchema = new database.Schema({

    startHour: Number,
    finalHour: Number,
    maxClients: Number,
    schedules: [schedulesScheme.model]

}, { collection: 'batteries' })

module.exports = {
    model: BatterySchema
}