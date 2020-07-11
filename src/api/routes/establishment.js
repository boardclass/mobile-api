const employeeController = require('../controllers/employeeController')
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
        employeeController.storeEmployee(req, res)
    })

    app.get('/api/establishment/employees', (req, res) => {
        employeeController.employees(req, res)
    })

    app.get('/api/establishment/agenda', (req, res) => {
        establishmentController.getAgenda(req, res)
    })

    app.get('/api/establishment/:establishment_id/:sport_id/:address_id/agenda', (req, res) => {
        establishmentController.getFilteredAgenda(req, res)
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

    app.put('/api/establishment/battery/:battery_id', (req, res) => {
        establishmentController.editBattery(req, res)
    })

    app.post('/api/establishment/situation', (req, res) => {
        establishmentController.storeSituation(req, res)
    })

    app.put('/api/establishment/situation', (req, res) => {
        establishmentController.editSituation(req, res)
    })

    app.get('/api/establishment/situation/:date', (req, res) => {
        establishmentController.situationByDate(req, res)
    })

    app.get('/api/establishment/schedules/:battery_id/:date', (req, res) => {
        establishmentController.getSchedulesByBattery(req, res)
    })

    app.put('/api/establishment/schedule', (req, res) => {
        establishmentController.editSchedule(req, res)
    })

    app.post('/api/establishment/schedule', (req, res) => {
        establishmentController.selfSchedule(req, res)
    })

    app.get('/api/establishment/extract/reference', (req, res) => {
        establishmentController.getExtractReference(req, res)
    })

    app.get('/api/establishment/extract/:month/:year', (req, res) => {
        establishmentController.getExtractByDate(req, res)
    })

    app.get('/api/establishment/extract/share/:month/:year', (req, res) => {
        establishmentController.shareExtract(req, res)
    })

}