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
        ref: addressSchema.type,
        required: true
    }

}, { collection: 'batteries' })

module.exports = {
    model: BatterySchema
}