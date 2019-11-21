module.exports = function (app) {

    require('../api/routes/user')(app)
    require('../api/routes/address')(app)
    require('../api/routes/establishment')(app)
    
} 