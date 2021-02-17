const { mongoose } = require('../../../config/mongodb')

const LogSchema = new mongoose.Schema({

    date: {
        type: Date,
        default: Date.now
    },
    endpoint: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
    },
    stack: {
        type: String,
        required: true
    }

}, { collection: 'logs' });

mongoose.model('Log', LogSchema)

module.exports = mongoose.model('Log')
