const controller = require('../controllers/userAccountController')

module.exports = (app) => {

    app.post('/api/account/sms', (req, res) => {
        controller.sendSMS(req, res)
    })

    app.post('/api/account/sms/validate', (req, res) => {
        controller.validateSMS(req, res)
    })

}