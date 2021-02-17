module.exports = (app) => {

    app.get('/api/address/:cep', (req, res) => {
        const controller = require(`../../${req.version}/controllers/addressController`)
        controller.findByCEP(req, res)
    })

}