const controller = require('../controllers/accountController')

module.exports = (app) => {

    // app.post('/api/account/sms', (req, res) => {
    //     controller.sendSMS(req, res)
    // })

    // app.post('/api/account/sms/validate', (req, res) => {
    //     controller.validateSMS(req, res)
    // })

    app.post('/api/user/password/reset', (req, res) => {
        controller.resetUserPassword(req, res)
    })

    app.post('/api/user/password/validate', (req, res) => {
        controller.validateUserPassword(req, res)
    })

    app.post('/api/establishment/password/reset', (req, res) => {
        controller.resetEstablishmentPassword(req, res)
    })

    app.post('/api/establishment/password/validate', (req, res) => {
        controller.validateEstablishmentPassword(req, res)
    })
}