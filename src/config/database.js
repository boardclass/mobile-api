const mysql = require('mysql2')
const connectionData = require('../config/mysql')

const pool = mysql.createPool({
    host: connectionData.host,
    user: connectionData.username,
    password: connectionData.password,
    database: connectionData.database,
    port: connectionData.port,
    waitForConnections: true,
    connectionLimit: connectionData.connectionLimit,
    queueLimit: 0
})

process.on('SIGINT', () =>
    pool.end(err => {
        if (err) return console.log(err)
        console.log('pool => fechado')
        process.exit(0)
    })
);

module.exports = pool