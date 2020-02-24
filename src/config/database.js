const mysql = require('mysql2')
const connectionData = require('../config/mysql')

const connection = mysql.createPool({
    host: connectionData.host,
    user: connectionData.username,
    password: connectionData.password,
    database: connectionData.database,
    port: connectionData.port,
    waitForConnections: true,
    connectionLimit: connectionData.connectionLimit,
    queueLimit: 0
})

// TODO: CHECK IF NEED CONNECTION INSTEAD POOL
// connection.connect((error => {
//     if (!error) {
//         console.log(`Database connected successfully on ${connectionData.uri}`)
//     } else {
//         console.log(error)
//     }
// }))

module.exports = {
    connection
}