const { mongoose } = require('../../config/mongodb')

const LogSchema = new mongoose.Schema({

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
    },
    date: {
        type: Date,
        default: Date.now
    }

}, { collection: 'logs' });

mongoose.model('Log', LogSchema)

module.exports = mongoose.model('Log')
