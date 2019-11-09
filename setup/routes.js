module.exports = function (app) {

    const rootDirectory = process.cwd()

    // API routes
    require('../api/routes/login')(app)
    require('../api/routes/signup')(app)
    require('../api/routes/account')(app)
    require('../api/routes/address')(app)
    require('../api/routes/battery')(app)
    require('../api/routes/schedule')(app)
    require('../api/routes/establishment')(app)
    
    // website routes
    require('../website/routes/battery')(app, rootDirectory)

} 