const controller = require('../controllers/userAddressController')

module.exports = (app) => {

    app.get('/api/address/:cep', (req, res) => {
        controller.findByCEP(req, res)
    })

}