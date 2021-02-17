module.exports = (app) => {

    app.get('/api/sports', (req, res) => {
        const controller = require(`../../${req.version}/controllers/sportController`)
        controller.all(req, res)
    })

}