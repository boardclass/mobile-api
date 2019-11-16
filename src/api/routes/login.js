const controller = require('../controllers/userController')

module.exports = (app) => {

    app.post('/api/login', (req, res) => {
        controller.login(req, res)
    })
    
}