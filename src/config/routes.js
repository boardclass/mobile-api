module.exports = function (app) {

    require('../api/routes/user')(app)
    require('../api/routes/login')(app)
    require('../api/routes/account')(app)
    require('../api/routes/address')(app)
    require('../api/routes/battery')(app)
    require('../api/routes/schedule')(app)
    require('../api/routes/establishment')(app)

} 