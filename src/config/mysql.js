const mysql = require('mysql2')

// module.exports = {
//     dialect: 'mysql',
//     uri:  'mysql://boardclass:12Boardapp@mysql669.umbler.com:41890/boardclass',
//     host: 'mysql669.umbler.com',
//     username: 'boardclass',
//     password: '12Boardapp',
//     database: 'boardclass',
//     port: 41890,
//     connectionLimit: 10,
//     define: {
//         timestamps: true,
//         underscored: true
//     }
// }

module.exports = {
    dialect: 'mysql',
    uri: process.env.JAWSDB_URL || 'mysql://mysql669.umbler.com:41890/boardclass',
    host: process.env.SQL_HOST || 'mysql669.umbler.com',
    username: process.env.SQL_USERNAME || 'boardclass',
    password: process.env.SQL_PASSWORD || '12Boardapp',
    database: process.env.SQL_DATABASE || 'boardclass',
    connectionLimit: 10,
    port: 41890,
    define: {
        timestamps: true,
        underscored: true
    }
}