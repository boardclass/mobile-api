const controller = require('../controllers/signup');

module.exports = (app) => {

    app.post('/api/user/signup', (req, res) => {
        controller.registerUser(req, res);
    });

    app.put('/api/user/:userId/signup/address', (req, res) => {
        controller.registerAddress(req, res);
    });
    
};