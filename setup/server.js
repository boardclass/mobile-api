const express = require('express');
const validator = require('express-validator');
const bodyParser = require('body-parser');

const app = express();

module.exports = {

    start: function () {

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(validator());

        require('./routes')(app);

        let port = process.env.PORT || 8080;

        app.listen(port, () => {
            console.log(`Server started on ${port}`);
        });

    }

};