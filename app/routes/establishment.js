const controller = require('../controllers/establishment')

module.exports = (app) => {

    app.post('/api/establishment/signup', (req, res) => {
        controller.signup(req, res)
    })
    
}