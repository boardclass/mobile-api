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
            files: [data.attachments]
        }, (error, result, fullResult) => {
            if (error) {
                console.log(err)
                return callback(null)
            }

            console.log(result);
            return callback(result)
        })

        // transporter.sendMail({
        //     from: `Board Class <atendimento@boardclass.com.br>`,
        //     to: data.destination,
        //     subject: data.subject,
        //     text: data.message,
        //     attachments: data.attachments
        // }).then(message => {
        //     callback(message)
        // }).catch(err => {
        //     console.log(err)
        //     callback(null)
        // })

    }

}