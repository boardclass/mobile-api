const employeeController = require('../controllers/employeeController')

module.exports = (app) => {

    app.post('/api/employee/login', (req, res) => {
        employeeController.login(req, res)
    })

}