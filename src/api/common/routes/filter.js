module.exports = (app) => {

    app.get('/api/filter/sports', (req, res) => {
        const controller = require(`../../${req.version}/controllers/filterController`)
        controller.sports(req, res)
    })

    app.get('/api/filter/addresses/:sport_id', (req, res) => {
        const controller = require(`../../${req.version}/controllers/filterController`)
        controller.addresses(req, res)
    })

    app.post('/api/filter/establishments', (req, res) => {
        const controller = require(`../../${req.version}/controllers/filterController`)
        controller.establishments(req, res)
    })

}