const userController = require('../controllers/userController')

module.exports = (app) => {

    app.post('/api/user', (req, res) => {
        userController.store(req, res)
    })

    app.get('/api/user/:cpf', (req, res) => {
        userController.getByCpf(req, res)
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

    app.get('/api/user/agenda', (req, res) => {
        userController.agenda(req, res)
    })

    app.get('/api/user/establishment/favorite', (req, res) => {
        userController.favoriteEstablishments(req, res)
    })

    app.post('/api/user/establishment/favorite', (req, res) => {
        userController.saveFavoriteEstablishment(req, res)
    })

    app.delete('/api/user/establishment/favorite', (req, res) => {
        userController.deleteFavoriteEstablishment(req, res)
    })

}