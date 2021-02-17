module.exports = (app) => {

    app.post('/api/schedule', (req, res) => {
        const controller = require(`../../${req.version}/controllers/scheduleController`)
        controller.store(req, res)
    })

}