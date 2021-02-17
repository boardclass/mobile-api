module.exports = {
    dialect: 'mysql',
    uri: process.env.JAWSDB_URL || 'mysql://root:root@localhost:3306/boardclass',
    host: process.env.SQL_HOST || 'localhost',
    username: process.env.SQL_USERNAME || 'root',
    password: process.env.SQL_PASSWORD || 'root',
    database: process.env.SQL_DATABASE || 'boardclass',
    connectionLimit: 10,
    port: process.env.SQL_PORT || 3306,
    define: {
        timestamps: true,
        underscored: true
    }
}