const mongoose = require('mongoose')
const userSchema = require('./user')

const SchedulesSchema = new mongoose.Schema({

    batteries: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'battery',
        required: true
    },
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