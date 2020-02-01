const { transporter } = require('../../config/nodemailer')

module.exports = {

    send: async function(data, callback) {

        transporter().sendMail({
            from: `Boardclass APP ${process.env.USER_EMAIL}`,
            to: data.destination,
            subject: data.subject,
            html: data.message
        }).then(message => {
            callback(message)
        }).catch(err => {
            console.log(err)
            callback(null)
        })

    }

}