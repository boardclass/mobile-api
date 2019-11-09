const controller = require('../controllers/battery')

module.exports = (app, root) => {

    app.get('/battery', (req, res) => {
        controller.getBatteryView(req, res, root)
    })

    app.post('/battery', (req, res) => {
        controller.createBattery(req, res, root)
    })

}