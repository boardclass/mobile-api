const controller = require('../controllers/schedule')

module.exports = (app) => {

    app.get('/api/establishment/:establishmentId/schedule', (req, res) => {
        controller.getScheduleByEstablishment(req, res)
    })

}