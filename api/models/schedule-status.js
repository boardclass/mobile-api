const mongoose = require('mongoose')

const ScheduleStatusSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    }

}, { collection: 'schduleStatus' })

module.exports = {
    model: ScheduleStatusSchema
}