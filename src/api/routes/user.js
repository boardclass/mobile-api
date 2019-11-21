const userController = require('../controllers/userController')
const userAddressController = require('../controllers/userAddressController')

module.exports = (app) => {

    app.post('/api/user', (req, res) => {
        userController.store(req, res)
    })

    app.post('/api/user/login', (req, res) => {
        userController.login(req, res)
    })

    app.put('/api/user/:user_id/address', (req, res) => {
        userAddressController.store(req, res)
    })
    
}