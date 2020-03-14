const file = require('../../.well-known/apple-app-site-association')

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

    app.get('/.well-known/apple-app-site-association', (req, res) => {
        res.json(file)
    })

} 