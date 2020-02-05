const mysql = require('mysql2')
const { uri } = require('../config/mysql')

const connection = mysql.createConnection(uri)

connection.connect((error => {
    if (!error) {
        console.log(`Database connected successfully on ${uri}`)
    } else {
        console.log(error)
    }
}))

module.exports = {
    connection
}