const http = require('http')

module.exports = {

    setTimer: function () {

        console.log('Timer was started');
        
        var http = require("http");
        setInterval(function () {
            http.get("https://board-class.herokuapp.com/")
        }, 300000); // every 5 minutes (300000)

    }

}