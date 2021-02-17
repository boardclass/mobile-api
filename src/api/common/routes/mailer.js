module.exports = (app) => {

    app.post('/api/mailer', (req, res) => {
        const controller = require(`../../${req.version}/controllers/mailerController`)
        controller.send(req, res)
    })

}