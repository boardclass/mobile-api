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

        let port = process.env.PORT_INDEX || 21273
        
        console.log(`process.env.PORT ${process.env.PORT}`);
        console.log(`process.env.PORT_INDEX ${process.env.PORT_INDEX}`);
        console.log(`process.env.PORT_SERVER ${process.env.PORT_SERVER}`);
        console.log(`process.env.PORT_APP ${process.env.PORT_APP}`);

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