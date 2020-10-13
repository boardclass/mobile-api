const mysql = require("mysql2")
const connectionData = require('../../config/mysql')

let dbConfig = {
    host: connectionData.host,
    user: connectionData.username,
    password: connectionData.password,
    database: connectionData.database,
    port: connectionData.port,
    waitForConnections: true,
    connectionLimit: connectionData.connectionLimit,
    queueLimit: 0,
    multipleStatements: true
};

const pool = mysql.createPool(dbConfig);

const connection = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) reject(err);
            console.log("MySQL pool connected: threadId " + connection.threadId);
            const query = (sql, binding) => {
                return new Promise((resolve, reject) => {
                    connection.query(sql, binding, (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                });
            };
            const release = () => {
                return new Promise((resolve, reject) => {
                    if (err) reject(err);
                    console.log("MySQL pool released: threadId " + connection.threadId);
                    resolve(connection.release());
                });
            };
            resolve({ query, release });
        });
    });
};

const query = (sql, binding) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, binding, (err, result, fields) => {
            if (err) reject(err);
            resolve(result);
        });
    });
};

module.exports = { pool, connection, query };