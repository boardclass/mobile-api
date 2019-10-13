const controller = require('../controllers/user');

module.exports = (app) => {

    app.post('/api/user/signup/data', (req, res) => {
        controller.registerData(req, res);
    });

    app.put('/api/user/:userId/signup/phone', (req, res) => {
        controller.updatePhone(req, res);
    });

    app.put('/api/user/:userId/signup/address', (req, res) => {
        controller.updateAddress(req, res);
    });

};