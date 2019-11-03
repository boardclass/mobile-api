const database = require('../../setup/database')
const userSchema = require('./user')
const batterySchema = require('./battery')
const scheduleSessionSchema = require('./schedule-session')

const SchedulesSchema = new database.Schema({

    battery: [batterySchema.model],
    user: userSchema.model,
    reservedVacancies: Number,
    registerDate: {
        type: Date,
        default: Date.now()
    }

}, { collection: 'schedules' })

module.exports = {
    model: SchedulesSchema
}