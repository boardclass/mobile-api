require('./sequelize')

const https = require('https')
const path = require('path')
const fs = require('fs')
const express = require('express')
const validator = require('express-validator')
const bodyParser = require('body-parser')

const pool = require('../config/database');
const middleware = require('./middleware')
const connectionMiddleware = require('./connectionMiddleware')
const excludedRoutes = require('./excludedRoutes')
const mongodb = require('./mongodb')

const app = express()

module.exports = {

    start: function () {

        app.use(bodyParser.json())
        app.use(bodyParser.urlencoded({ extended: true }))
        app.use(validator())

        app.use(unless(excludedRoutes.excluded, middleware.validateToken))
        app.use(middleware.versioning)
        app.use(connectionMiddleware(pool))

        require('./routes')(app)

        mongodb.setup()

        let port = process.env.PORT || 8080

        const sslServer = https.createServer(
            {
                key: fs.readFileSync(path.join(__dirname, '../../cert/ssl', 'key.pem')),
                cert: fs.readFileSync(path.join(__dirname, '../../cert/ssl', 'cert.pem')),
            },
            app
        )

        app.listen(port, () => {
            console.log(`Server started on ${port}`)
        })

    }

}

const unless = function (paths, middleware) {
    return function (req, res, next) {

        if (paths.includes(req.path)) {
            return next()
        } else {
            return middleware(req, res, next)
        }
    }
}