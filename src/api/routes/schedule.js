const scheduleController = require('../controllers/scheduleController')

module.exports = (app) => {

    app.post('/api/schedule', (req, res) => {
        scheduleController.store(req, res)
    })

}