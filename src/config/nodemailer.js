const nodemailer = require('nodemailer')

exports.transporter = function() {
  
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'lifestyleboardapp@gmail.com',
            pass: '12Boardapp!@#$'
        }
    })
    
}

