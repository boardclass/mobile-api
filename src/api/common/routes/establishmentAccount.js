module.exports = (app) => {

    app.post('/api/establishment/password/token', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentAccountController`)
        controller.tokenPassword(req, res)
    })

    app.post('/api/establishment/password/validate', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentAccountController`)
        controller.validatePassword(req, res)
    })

    app.post('/api/establishment/password/reset', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentAccountController`)
        controller.resetPassword(req, res)
    })
    
}