const mongoose = require('mongoose')

const ScheduleStatusSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    }

}, { collection: 'schdulesStatus' })

mongoose.model('schduleStatus', ScheduleStatusSchema)

module.exports = {
    model: ScheduleStatusSchema
}