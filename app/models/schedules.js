const database = require('../../setup/database')
const userSchema = require('./user')
const scheduleSessionSchema = require('./schedule-session')

const SchedulesSchema = new database.Schema({

    session: scheduleSessionSchema.model,
    user: userSchema.model,
    registerDate: {
        type: Date,
        default: Date.now()
    }

}, { collection: 'schedules' })