const mongoose = require('mongoose')
const addressSchema = require('./address')
const schedulesSchema = require('./schedules')
const scheduleStatusSchema = require('./schedule-status')
 
const ScheduleSchema = new mongoose.Schema({

    dates: [{
        date: Date,
        schedules: [schedulesSchema.model],
        address: addressSchema.model,
        status: scheduleStatusSchema.model 
    }]  

}, {collection: 'agendas'})

mongoose.model('schedule', ScheduleSchema)

module.exports = {
    model: ScheduleSchema
}