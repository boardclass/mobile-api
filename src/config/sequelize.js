const Sequelize = require("sequelize");
const { URI, define } = require("./mysql");

const Role = require("../api/common/models/Role");
const User = require("../api/common/models/User");
const UserAccount = require("../api/common/models/UserAccount");
const UserAddress = require("../api/common/models/UserAddress");
const UsersRoles = require("../api/common/models/UsersRoles");
const Establishment = require("../api/common/models/Establishment");
const EstablishmentAccount = require("../api/common/models/EstablishmentAccount");
const EstablishmentAddress = require("../api/common/models/EstablishmentAddress");
const EstablishmentEmployees = require("../api/common/models/EstablishmentEmployees");
const Batteries = require("../api/common/models/Batteries");
const Sports = require("../api/common/models/Sports");
const Agendas = require("../api/common/models/Agendas");
const AgendaStatus = require("../api/common/models/AgendaStatus");
const AgendaDates = require("../api/common/models/AgendaDates");

const connection = new Sequelize(URI, {
  define: define
});

Role.init(connection);
User.init(connection);
UserAccount.init(connection);
UserAddress.init(connection);
UsersRoles.init(connection);
Establishment.init(connection);
EstablishmentAccount.init(connection);
EstablishmentAddress.init(connection);
EstablishmentEmployees.init(connection);
Batteries.init(connection);
Sports.init(connection);
Agendas.init(connection);
AgendaDates.init(connection);
AgendaStatus.init(connection);

Role.associate(connection.models);
User.associate(connection.models);
UserAddress.associate(connection.models);
UserAccount.associate(connection.models);
UsersRoles.associate(connection.models);
Establishment.associate(connection.models);
EstablishmentAccount.associate(connection.models);
EstablishmentAddress.associate(connection.models);
EstablishmentEmployees.associate(connection.models);
Batteries.associate(connection.models);
Sports.associate(connection.models);
Agendas.associate(connection.models);
AgendaDates.associate(connection.models);
AgendaStatus.associate(connection.models);

exports.start = () => {
  connection
    .authenticate()
    .then(() => {
      console.log(
        `Sequelize connection has been established successfully on ${URI}`
      );
    })
    .catch((err) => {
      console.error(`Unable to connect to the database: on ${URI}`, err);
    });
};
