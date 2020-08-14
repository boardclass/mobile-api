const mysql = require('mysql2')

module.exports = {
    dialect: 'mysql',
    uri: process.env.JAWSDB_URL || 'mysql://root:@localhost/boardclass',
    host: process.env.SQL_HOST || 'localhost',
    username: process.env.SQL_USERNAME || 'root',
    password: process.env.SQL_PASSWORD || '',
    database: process.env.SQL_DATABASE || 'boardclass',
    connectionLimit: 10,
    define: {
        timestamps: true,
        underscored: true
    }
}