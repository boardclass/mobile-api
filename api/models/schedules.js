const mongoose = require('mongoose')
const userSchema = require('./user')

const SchedulesSchema = new mongoose.Schema({

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