const mongoose = require('mongoose')
const addressSchema = require('./address')
const scheduleStatusSchema = require('./schedule-status')
const batteryScheme = require('./battery')
 
const ScheduleSchema = new mongoose.Schema({

    dates: [{
        date: Date,
        batteries: [batteryScheme.model],
        address: addressSchema.model,
        status: scheduleStatusSchema.model 
    }]  

}, {collection: 'schedule'})

module.exports = {
    model: ScheduleSchema
}