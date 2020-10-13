const mongoose = require('mongoose')

module.exports = {

    setup: function () {

        // var databaseURL = 'mongodb://kamino.mongodb.umbler.com:46538/boardclass-log'
        var databaseURL = process.env.MONGODB_URI || 'mongodb://localhost/board'

        mongoose.connect(databaseURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then(_ => {
            console.log(`Mongo connected on: ${databaseURL}`);
        }).catch(err => {
            console.log(`Mongo connection failure: ${err}`);
        })

        mongoose.set('useCreateIndex', true)

    },
    mongoose: mongoose

}