const https = require('https')

module.exports = {

    setTimer: function () {
        
        setInterval(function () {
            https.get("https://board-class-develop.herokuapp.com/")
        }, 900000); // every 15 minutes (900000)

    }

}