const http = require('http')

module.exports = {

    setTimer: function () {

        console.log('Começando timer');
        
        var http = require("http");
        setInterval(function () {
            http.get("http://board-class.herokuapp.com");
        }, 300000); // every 5 minutes (300000)

    }

}