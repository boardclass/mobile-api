const nodemailer = require('nodemailer')

exports.transporter = function() {
  
    console.log(process.env.USER_EMAIL);
    console.log(process.env.USER_EMAIL_PASSWORD);

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.USER_EMAIL || "lifestyleboardapp@gmail.com",
            pass: process.env.USER_EMAIL_PASSWORD || "12Boardapp!@#$"
        }
    })
    
}

