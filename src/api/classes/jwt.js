const jwt = require('jsonwebtoken')

module.exports = {

    generate: function (userId) {

        const token = jwt.sign({ userId }, this.secret, {
            algorithm: 'HS256',
            //expiresIn: this.expirationSeconds
        })

        return token

    },
    validate: function (req, res, token, next) {        

        jwt.verify(token, this.secret, (err, decoded) => {

            if (err) {

                return res.status(400).json({
                    success: false,
                    message: 'Token is not valid',
                    verbose: err,
                    data: {}
                })

            } else {
                req.decoded = decoded
                next()
            }

        })
        
    },
    secret: process.env.SECRET_KEY || 'worldisfullofdevelopers',
    expirationSeconds: 1000

}