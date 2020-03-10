const scheduleController = require('../controllers/scheduleController')

module.exports = (app) => {

    app.post('/api/schedule', (req, res) => {
        scheduleController.store(req, res)
    })

    app.post('/api/schedule/pay/:schedule_id', (req, res) => {
        scheduleController.pay(req, res)
    })

}