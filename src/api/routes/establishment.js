const establishmentController = require('../controllers/establishmentController')

module.exports = (app) => {

    app.post('/api/establishment', (req, res) => {
        establishmentController.store(req, res)
    })

    app.post('/api/establishment/login', (req, res) => {
        establishmentController.login(req, res)
    })

    app.post('/api/establishment/:establishment_id/branch', (req, res) => {
        establishmentController.storeBranch(req, res)
    })

    app.post('/api/establishment/:establishment_id/address', (req, res) => {
        establishmentController.storeAddress(req, res)
    })

    app.post('/api/establishment/:establishment_id/employee', (req, res) => {
        establishmentController.storeEmployee(req, res)
    })

    app.post('/api/establishment/filter', (req, res) => {
        establishmentController.filter(req, res)
    })

    app.get('/api/establishment/filter', (req, res) => {
        establishmentController.getFilters(req, res)
    })

    app.get('/api/establishment/:establishment_id/agenda', (req, res) => {
        establishmentController.getAgenda(req, res)
    })

}