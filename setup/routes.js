let middleware = require('./middleware')

module.exports = function (app) {

    require('../app/routes/login')(app)
    require('../app/routes/signup')(app)
    require('../app/routes/account')(app)
    require('../app/routes/address')(app)
    require('../app/routes/establishment')(app)

} 