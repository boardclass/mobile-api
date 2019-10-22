const express = require('express')
const validator = require('express-validator')
const bodyParser = require('body-parser')
const middleware = require('./middleware')

const app = express()

module.exports = {

    start: function () {

        app.use(bodyParser.json())
        app.use(bodyParser.urlencoded({ extended: true }))
        app.use(validator())
        
        require('./routes')(app)

        app.use(unless('/api/login'), middleware.validateToken)

        let port = process.env.PORT || 8080

        app.listen(port, () => {
            console.log(`Server started on ${port}`)
        })

    }

}

var unless = function(path, middleware) {
    return function(req, res, next) {
        if (path === req.path) {
            return next()
        } else {
            return middleware(req, res, next)
        }
    }
}