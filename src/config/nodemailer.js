const nodemailer = require('nodemailer')

exports.transporter = function() {
  
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_EMAIL_PASSWORD
        }
    })
    
}

