const nodemailer = require('nodemailer')

exports.transporter = function() {

    console.log(process.env.USER_EMAIL);
    console.log(process.env.USER_EMAIL_PASSWORD);
    
    return nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: true,
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_EMAIL_PASSWORD
        }
    })
    
}

