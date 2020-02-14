const logger = require('./logger')

exports.handleError = function (req, res, code, message, err) {

    console.log(err);

    logger.register(err, req, _ => {

        return res.status(code).json({
            success: false,
            message: message,
            verbose: `${err}`,
            data: {}
        })

    })

}