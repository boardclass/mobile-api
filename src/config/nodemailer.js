const nodemailer = require('nodemailer')

exports.transporter = function() {

    console.log(process.env.USER_EMAIL);
    console.log(USER_EMAIL_PASSWORD);
    
    return nodemailer.createTransport({
        host: 'smtp.zoho.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_EMAIL_PASSWORD
        }
    })
    
}

