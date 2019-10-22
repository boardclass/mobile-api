const mongoose = require('mongoose')
const Schema = mongoose.Schema

mongoose.connect('mongodb://localhost/board', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

mongoose.set('useCreateIndex', true)

module.exports = {
    mongoose: mongoose,
    Schema: Schema
}