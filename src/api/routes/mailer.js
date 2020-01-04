const mailerController = require('../controllers/mailerController')

module.exports = (app) => {

    app.post('/api/mailer', (req, res) => {
        mailerController.send(req, res)
    })

}