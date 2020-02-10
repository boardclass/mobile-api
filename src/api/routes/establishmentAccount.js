const controller = require('../controllers/establishmentController')

module.exports = (app) => {

    app.post('/api/establishment/password/token', (req, res) => {
        controller.tokenPassword(req, res)
    })

    app.post('/api/establishment/password/validate', (req, res) => {
        controller.validatePassword(req, res)
    })

    app.post('/api/establishment/password/reset', (req, res) => {
        controller.resetPassword(req, res)
    })
    
}