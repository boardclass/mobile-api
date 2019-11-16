const userController = require('../controllers/userController')
const addressController = require('../controllers/addressController')

module.exports = (app) => {

    app.post('/api/user', (req, res) => {
        userController.store(req, res)
    })

    app.put('/api/user/:user_id/address', (req, res) => {
        addressController.store(req, res)
    })
    
}