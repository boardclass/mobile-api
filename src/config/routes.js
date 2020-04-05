module.exports = function (app) {
    require('../api/routes/user')(app)
    require('../api/routes/address')(app)
    require('../api/routes/establishment')(app)
    require('../api/routes/mailer')(app)
    require('../api/routes/schedule')(app)
    require('../api/routes/filter')(app)
    require('../api/routes/userAccount')(app)
    require('../api/routes/establishmentAccount')(app)
    require('../api/routes/sport')(app)
    require('../api/routes/employee')(app)

    app.get('/.well-known/user/apple-app-site-association', (req, res) => {
        const file = require('../../.well-known/user/apple-app-site-association')
        res.json(file)
    })

    app.get('/.well-known/establishment/apple-app-site-association', (req, res) => {
        const file = require('../../.well-known/establishment/apple-app-site-association')
        res.json(file)
    })

} 