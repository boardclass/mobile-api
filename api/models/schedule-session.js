const mongoose = require('mongoose')
const scheduleSchema = require('./schedules')

const ScheduleSessionSchema = new mongoose.Schema({

    time: Number,
    value: String,
    schedules: {
        type: [scheduleSchema.model],
        required: false
    },

}, { collection: 'scheduleSessions' })

mongoose.model('scheduleSession', ScheduleSessionSchema)

module.exports = {
    model: ScheduleSessionSchema
}