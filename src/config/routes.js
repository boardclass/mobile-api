const fs = require('fs');
const path = require('path');

module.exports = function (app) {
    
    require('../api/common/routes/user')(app)
    require('../api/common/routes/address')(app)
    require('../api/common/routes/establishment')(app)
    require('../api/common/routes/mailer')(app)
    require('../api/common/routes/schedule')(app)
    require('../api/common/routes/filter')(app)
    require('../api/common/routes/userAccount')(app)
    require('../api/common/routes/establishmentAccount')(app)
    require('../api/common/routes/sport')(app)
    require('../api/common/routes/employee')(app)
    
    app.get('/apple-app-site-association', (req, res) => { 
        const pathh = path.resolve(__dirname, '..','..','apple-app-site-association')
        const content = fs.readFileSync(pathh, 'utf8');
        res.set('Content-Type', 'application/json')
        res.status(200)
        res.send(content)
    })

} 