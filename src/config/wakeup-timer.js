const https = require('https')

module.exports = {

    setTimer: function () {
        
        setInterval(function () {
            https.get("https://board-class.herokuapp.com/")
            https.get("https://board-class-develop.herokuapp.com/")
        }, 300000); // every 5 minutes (300000)

    }

}