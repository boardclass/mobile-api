const database = require('../../setup/database')
const addressSchema = require('./address')
const batterySchema = require('./battery')
const schedulesSchema = require('./schedules')
const scheduleStatusSchema = require('./schedule-status')
 
const SceduleSchema = new database.Schema({

    dates: [{
        date: Date,
        batteries: [batterySchema.model],
        schedules: [schedulesSchema.model],
        address: addressSchema.model,
        status: scheduleStatusSchema.model 
    }]  

}, {collection: 'schedule'})

module.exports = {
    model: SceduleSchema
}