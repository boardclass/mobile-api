const mongoose = require('mongoose')
const addressSchema = require('./address')
const scheduleSessionSchema = require('./schedule-session')

const BatterySchema = new mongoose.Schema({

    startHour: {
        type: Number,
        required: true
    },
    finishHour: {
        type: Number,
        required: true
    },
    amountClient: {
        type: Number,
        required: true
    },
    session: {
        type: scheduleSessionSchema.model,
        required: true
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "address",
        required: true
    }

}, { collection: 'batteries' })

mongoose.model('battery', BatterySchema)

module.exports = {
    model: BatterySchema
}