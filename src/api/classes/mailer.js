const { transporter } = require('../../config/nodemailer')

module.exports = {

    send: async function(data, callback) {

        transporter().sendMail({
            from: 'Boardclass APP <lifestyleboardapp@gmail.com>',
            to: data.destination,
            subject: data.subject,
            html: data.message
        }).then(message => {
            callback(message)
        }).catch(err => {
            callback(null)
        })

    }

}