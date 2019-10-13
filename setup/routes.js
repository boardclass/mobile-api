module.exports = function (app) {

    require('../app/routes/login')(app);
    require('../app/routes/signup')(app);
    require('../app/routes/account')(app);

}; 