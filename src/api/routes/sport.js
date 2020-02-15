const sportController = require('../controllers/sportController')

module.exports = (app) => {

    app.get('/api/sports', (req, res) => {
        sportController.all(req, res)
    })

}