module.exports = (app) => {

    app.get('/api/employee/:cpf', (req, res) => {
        const controller = require(`../../${req.version}/controllers/employeeController`)
        controller.getEmployeeByCPF(req, res)
    })

    app.post('/api/employee/login', (req, res) => {
        const controller = require(`../../${req.version}/controllers/employeeController`)
        controller.login(req, res)
    })

}