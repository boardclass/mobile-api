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

    app.get('/user/.well-known/apple-app-site-association', (req, res) => {
        const file = require('../../domains/user/.well-known/apple-app-site-association')
        res.json(file)
    })

    app.get('/establishment/.well-known/apple-app-site-association', (req, res) => {
        const file = require('../../domains/establishment/.well-known/apple-app-site-association')
        res.json(file)
    })

} 