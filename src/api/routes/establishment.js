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

    app.post('/api/establishment/address', (req, res) => {
        establishmentController.storeAddress(req, res)
    })

    app.get('/api/establishment/service_addresses', (req, res) => {
        establishmentController.serviceAddresses(req, res)
    })

    app.post('/api/establishment/employee', (req, res) => {
        establishmentController.storeEmployee(req, res)
    })

    app.get('/api/establishment/employees', (req, res) => {
        establishmentController.employees(req, res)
    })

    app.get('/api/establishment/:establishment_id/agenda', (req, res) => {
        establishmentController.getAgenda(req, res)
    })

    app.post('/api/establishment/:establishment_id/available_batteries', (req, res) => {
        establishmentController.getAvailableBatteries(req, res)
    })

    app.get('/api/establishment/batteries', (req, res) => {
        establishmentController.batteries(req, res)
    })

    app.get('/api/establishment/:date/batteries', (req, res) => {
        establishmentController.getBatteriesByDate(req, res)
    })

    app.post('/api/establishment/battery', (req, res) => {
        establishmentController.storeBattery(req, res)
    })

    app.delete('/api/establishment/battery', (req, res) => {
        // TODO: Implement delete endpoint on controller
        establishmentController.deleteBattery(req, res)
    })

    app.post('/api/establishment/situation', (req, res) => {
        establishmentController.storeSituation(req, res)
    })

    app.get('/api/establishment/schedules', (req, res) => {
        establishmentController.getSchedules(req, res)
    })

}