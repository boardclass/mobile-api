const database = require('../../setup/database')

const ScheduleSessionSchema = new database.Schema({

    time: Number,
        value: String

}, { collection: 'scheduleSessions' })