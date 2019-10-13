const controller = require('../controllers/login');

module.exports = (app) => {

    app.post('/api/login', (req, res) => {
        controller.login(req, res);
    });
    
};