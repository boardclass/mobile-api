const controller = require('../controllers/establishment')

module.exports = (app) => {

    app.post('/api/establishment/signup', (req, res) => {
        controller.signup(req, res)
    })
    
    app.post('/api/establishment/login', (req, res) => {
        controller.login(req, res)
    })

}