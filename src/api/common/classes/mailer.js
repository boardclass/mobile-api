module.exports = {

    send: function (data, callback) {

        const send = require('gmail-send')({
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD,
            to: data.destination,
            subject: data.subject,
        });

        send({
            text: data.message,
            files: data.attachments
        }, (error, result, fullResult) => {
            if (error) {
                return callback(error, null)
            }

            return callback(null, result);
        })

    }

}