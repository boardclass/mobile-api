const employeeController = require('../controllers/employeeController')

module.exports = (app) => {

    app.get('/api/employee/:cpf', (req, res) => {
        employeeController.getEmployeeByCPF(req, res)
    })

    app.post('/api/employee/login', (req, res) => {
        employeeController.login(req, res)
    })

}