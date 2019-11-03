const database = require('../../setup/database')
const addressSchema = require('./address')
const batterySchema = require('./battery')
const scheduleStatusSchema = require('./schedule-status')
 
const SceduleSchema = new database.Schema({

    dates: [{
        date: Date,
        bateries: [batterySchema.model],
        address: addressSchema.model,
        status: scheduleStatusSchema.model 
    }]  

}, {collection: 'schedules'})

module.exports = {
    model: SceduleSchema
}