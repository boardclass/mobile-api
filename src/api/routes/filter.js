const controller = require('../controllers/filterController')

module.exports = (app) => {

    app.get('/api/filter/sports', (req, res) => {
        controller.sports(req, res)
    })

    app.get('/api/filter/addresses/:sport_id', (req, res) => {
        controller.addresses(req, res)
    })

    app.post('/api/filter/establishments', (req, res) => {
        controller.establishments(req, res)
    })

}