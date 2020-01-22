const Log = require('../models/Log');

module.exports = {

    register: function (err, req, next) {

        let log = new Log({
            endpoint: req. url,
            message: err.message,
            stack: err.stack
        })

        log.save()
            .then(function () {
                next()
            }, function (err) {
                next(err)
            })

    }

}