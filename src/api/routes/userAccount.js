const controller = require('../controllers/accountController')

module.exports = (app) => {

    app.post('/api/user/password/token', (req, res) => {
        controller.tokenPassword(req, res)
    })

    app.post('/api/user/password/reset', (req, res) => {
        controller.resetPassword(req, res)
    })

    app.post('/api/user/password/validate', (req, res) => {
        controller.validatePassword(req, res)
    })
}