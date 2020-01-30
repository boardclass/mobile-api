const { transporter } = require('../../config/nodemailer')
const logger = require('../classes/logger')

module.exports = {

    send: async function(data, callback) {

        console.log(data);

        transporter().sendMail({
            from: 'Boardclass APP <lifestyleboardapp@gmail.com>',
            to: data.destination,
            subject: data.subject,
            html: data.message
        }).then(message => {
            callback(message)
        }).catch(err => {
            console.log(err);
            callback(null)
        })

    }

}