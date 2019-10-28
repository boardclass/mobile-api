const controller = require('../controllers/address')

module.exports = (app) => {

    app.get('/api/user/address/:cep', (req, res) => {
        controller.findByCEP(req, res)
    })

}