module.exports = (app) => {

    app.post('/api/establishment', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.store(req, res)
    })

    app.post('/api/establishment/login', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.login(req, res)
    })

    app.post('/api/establishment/:establishment_id/branch', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.storeBranch(req, res)
    })

    app.post('/api/establishment/address', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.storeAddress(req, res)
    })

    app.get('/api/establishment/service_addresses', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.serviceAddresses(req, res)
    })

    app.post('/api/establishment/employee', (req, res) => {
        const controller = require(`../../${req.version}/controllers/employeeController`)
        controller.storeEmployee(req, res)
    })

    app.get('/api/establishment/employees', (req, res) => {
        const controller = require(`../../${req.version}/controllers/employeeController`)
        controller.employees(req, res)
    })

    app.get('/api/establishment/agenda', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.getAgendaStatus(req, res)
    })

    app.get('/api/establishment/:establishment_id/:sport_id/:address_id/agenda', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.getAvailableAgenda(req, res)
    })

    app.post('/api/establishment/:establishment_id/available_batteries', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        console.log(req.version);
        if (req.version == 'v1') {
            controller.getFilteredAgenda(req, res)
        }
        controller.getAvailableBatteries(req, res)
    })

    app.get('/api/establishment/batteries', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.batteries(req, res)
    })

    app.get('/api/establishment/:date/batteries', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.getBatteriesByDate(req, res)
    })

    app.post('/api/establishment/battery', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.storeBattery(req, res)
    })

    app.post('/api/establishment/holiday/battery', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.storeHolidayBattery(req, res)
    })

    app.put('/api/establishment/battery/:battery_id', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.editBattery(req, res)
    })

    app.post('/api/establishment/situation', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.storeSituation(req, res)
    })

    app.put('/api/establishment/situation', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.editSituation(req, res)
    })

    app.get('/api/establishment/situation/:date', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.situationByDate(req, res)
    })

    app.get('/api/establishment/schedules/:battery_id/:date', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.getSchedulesByBattery(req, res)
    })

    app.put('/api/establishment/schedule', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.editSchedule(req, res)
    })

    app.post('/api/establishment/schedule', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.selfSchedule(req, res)
    })

    app.get('/api/establishment/extract/reference', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.getExtractReference(req, res)
    })

    app.get('/api/establishment/extract/:month/:year', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.getExtractByDate(req, res)
    })

    app.get('/api/establishment/extract/share/:month/:year', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.shareExtract(req, res)
    })

    app.get('/api/establishment/holidays', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.holidays(req, res)
    })

    app.get('/api/establishment/batteries/:holiday_id', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.getBatteriesByHoliday(req, res)
    })

    app.delete('/api/establishment/battery/:battery_id', (req, res) => {
        const controller = require(`../../${req.version}/controllers/establishmentController`)
        controller.dropBattery(req, res)
    })

}