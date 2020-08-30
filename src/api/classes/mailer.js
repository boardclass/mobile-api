const nodemailer = require('nodemailer')
const mailGun = require('nodemailer-mailgun-transport')

module.exports = {

    send: function (data, callback) {

        const auth = {
            auth: {
                api_key: "b71d032b4eb737544c8c78724f5a7b56-074fa10c-849b62d2",
                domain: "sandbox67f74dc1590a4f7a92b78e4372c54cc9.mailgun.org"
            }
        }

        const transporter = nodemailer.createTransport(mailGun(auth))

        transporter.sendMail({
            from: `Board Class <atendimento@boardclass.com.br>`,
            to: data.destination,
            subject: data.subject,
            text: data.message,
            attachments: data.attachments
        }).then(message => {
            callback(message)
        }).catch(err => {
            console.log(err)
            callback(null)
        })

    }

}