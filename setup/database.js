const mongoose = require('mongoose')
const Schema = mongoose.Schema

var databaseURL = process.env.MONGODB_URI || 'mongodb://localhost/board'

mongoose.connect(databaseURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.set('useCreateIndex', true)

module.exports = {
    mongoose: mongoose,
    Schema: Schema
}