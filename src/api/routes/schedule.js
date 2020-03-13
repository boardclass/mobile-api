const scheduleController = require('../controllers/scheduleController')

module.exports = (app) => {

    app.post('/api/schedule', (req, res) => {
        scheduleController.store(req, res)
    })

    app.post('/api/schedules/pay', (req, res) => {
        scheduleController.pay(req, res)
    })

}