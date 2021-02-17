module.exports = (app) => {

    app.post('/api/user/password/token', (req, res) => {
        const controller = require(`../../${req.version}/controllers/userAccountController`)
        controller.tokenPassword(req, res)
    })

    app.post('/api/user/password/reset', (req, res) => {
        const controller = require(`../../${req.version}/controllers/userAccountController`)
        controller.resetPassword(req, res)
    })

    app.post('/api/user/password/validate', (req, res) => {
        const controller = require(`../../${req.version}/controllers/userAccountController`)
        controller.validatePassword(req, res)
    })
}