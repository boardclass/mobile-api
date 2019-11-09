const controller = require('../controllers/battery')

module.exports = (app) => {

    app.post('/api/:userid/battery', (req, res) => {
        controller.create(req, res)
    })

}