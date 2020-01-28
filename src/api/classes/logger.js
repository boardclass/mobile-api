const Log = require('../models/Log');

module.exports = {

    register: async function (err, req, next) {

        let log = new Log({
            endpoint: req. url,
            message: err.message,
            stack: err.stack
        })

        await log.save()
            .then(function () {
                next()
            }, function (err) {
                next(err)
            })

    }

}