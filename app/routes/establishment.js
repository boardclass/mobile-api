const controller = require('../controllers/establishment')

module.exports = (app) => {

    app.post('/api/establishment/signup', (req, res) => {
        controller.signup(req, res)
    })
    
    app.post('/api/establishment/login', (req, res) => {
        controller.login(req, res)
    })

    app.post('/api/establishment/address', (req, res) => {
        controller.registerAttendanceAddress(req, res)
    })

    app.get('/api/establishments/address', (req, res) => {
        controller.establishmentsAddress(req, res)
    })

}