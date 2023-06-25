const connection = require("./sequelize");

const express = require("express");
const validator = require("express-validator");
const bodyParser = require("body-parser");

const middleware = require("./middleware");
const excludedRoutes = require("./excludedRoutes");

const app = express();

module.exports = {
  start: function () {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(validator());

    app.use(unless(excludedRoutes.excluded, middleware.validateToken));
    app.use(middleware.versioning);

    require("./routes")(app);

    let port = process.env.PORT_INDEX || 8080;

    connection.start();

    app.listen(port, () => {
      console.log(`Server started on following ${port}`);
    });
  },
};

const unless = function (paths, middleware) {
  return function (req, res, next) {
    if (paths.includes(req.path)) {
      return next();
    } else {
      return middleware(req, res, next);
    }
  };
};
