const userController = require('../controllers/userController')

module.exports = (app) => {

    app.post('/api/user', (req, res) => {
        userController.store(req, res)
    })

    app.post('/api/user/login', (req, res) => {
        userController.login(req, res)
    })

    app.put('/api/user/:user_id/address', (req, res) => {
        userController.storeAddress(req, res)
    })

    app.post('/api/user/:user_id/role', (req, res) => {
        userController.storeRole(req, res)
    })
    
}