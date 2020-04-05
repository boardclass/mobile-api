const fs = require('fs');
const path = require('path');

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

    app.get('/apple-app-site-association', (req, res) => { 
        var pathh = path.resolve(__dirname, '../../', 'apple-app-site-association')
        var content = fs.readFileSync(pathh, 'utf8');
        res.set('Content-Type', 'application/json')
        res.status(200)
        res.send(content)
    })

} 