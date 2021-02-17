module.exports = (app) => {

    app.post('/api/user', (req, res) => {
        const userController = require(`../../${req.version}/controllers/userController`)
        userController.store(req, res)
    })

    app.post('/api/user/login', (req, res) => {
        const userController = require(`../../${req.version}/controllers/userController`)
        userController.login(req, res)
    })

    app.put('/api/user/:user_id/address', (req, res) => {
        const userController = require(`../../${req.version}/controllers/userController`)
        userController.storeAddress(req, res)
    })

    app.post('/api/user/:user_id/role', (req, res) => {
        const userController = require(`../../${req.version}/controllers/userController`)
        userController.storeRole(req, res)
    })

    app.get('/api/user/agenda', (req, res) => {
        const userController = require(`../../${req.version}/controllers/userController`)
        userController.agenda(req, res)
    })

    app.get('/api/user/:cpf', (req, res) => {
        const userController = require(`../../${req.version}/controllers/userController`)
        userController.getByCpf(req, res)
    })

    app.get('/api/user/establishment/favorite', (req, res) => {
        const userController = require(`../../${req.version}/controllers/userController`)
        userController.favoriteEstablishments(req, res)
    })

    app.post('/api/user/establishment/favorite', (req, res) => {
        const userController = require(`../../${req.version}/controllers/userController`)
        userController.saveFavoriteEstablishment(req, res)
    })

    app.delete('/api/user/establishment/favorite', (req, res) => {
        const userController = require(`../../${req.version}/controllers/userController`)
        userController.deleteFavoriteEstablishment(req, res)
    })

}