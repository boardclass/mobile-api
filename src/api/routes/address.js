const controller = require('../controllers/addressController')

module.exports = (app) => {

    app.get('/api/address/:cep', (req, res) => {
        controller.findByCEP(req, res)
    })

}