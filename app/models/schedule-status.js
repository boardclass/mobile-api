const database = require('../../setup/database')

const ScheduleStatusSchema = new database.Schema({

    name: {
        type: String,
        required: true
    }

}, { collection: 'schduleStatus' })

module.exports = {
    model: ScheduleStatusSchema
}