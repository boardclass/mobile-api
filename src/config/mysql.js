const mysql = require('mysql2')

module.exports = {
    dialect: 'mysql',
    uri: process.env.JAWSDB_URL || 'mysql://root:@localhost/board_class',
    host: 'localhost',
    username: 'root',
    database: 'board_class',
    define: {
        timestamps: true,
        underscored: true
    },

    connect: function (uri, callback) {

        var connection = mysql.createConnection(uri)

        callback(connection)

    }
}

