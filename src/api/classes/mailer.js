const nodemailer = require('nodemailer')
const mailGun = require('nodemailer-mailgun-transport')

module.exports = {

    send: function (data, callback) {

        const auth = {
            auth: {
                api_key: process.env.MAIL_API_KEY,
                domain: process.env.MAIL_DOMAIN 
            }
        }

        const transporter = nodemailer.createTransport(mailGun(auth))

        transporter.sendMail({
            from: `Board Class <lifestyleboardapp@gmail.com`,
            to: data.destination,
            subject: data.subject,
            text: data.message
        }).then(message => {
            callback(message)
        }).catch(err => {
            console.log(err)
            callback(null)
        })

    }

}