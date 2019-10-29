const https = require('https')

module.exports = {

    setTimer: function () {

        console.log('Timer was started');
        
        setInterval(function () {
            http.get("https://board-class.herokuapp.com/")
        }, 300000); // every 5 minutes (300000)

    }

}