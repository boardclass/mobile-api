const mysql = require('mysql2')

module.exports = {
    dialect: 'mysql',
    uri: process.env.JAWSDB_URL || 'mysql://root:@localhost/board_class',
    host: process.env.SQL_HOST || 'localhost',
    username: process.env.SQL_USERNAME || 'root',
    password: process.env.SQL_PASSWORD || '',
    database: process.env.SQL_DATABASE || 'board_class',
    connectionLimit: 10,
    define: {
        timestamps: true,
        underscored: true
    },

    connect: function (uri, callback) {

        var connection = mysql.createConnection(uri)

        connection.connect()
        callback(connection)

    }
}