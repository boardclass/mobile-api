module.exports = {
    dialect: 'mysql',
    host: process.env.SQL_HOST || 'host',
    username: process.env.SQL_USERNAME || 'username',
    password: process.env.SQL_PASSWORD || 'password',
    database: process.env.SQL_DATABASE || 'database',
    connectionLimit: 10,
    port: process.env.SQL_PORT || 3306,
    define: {
        timestamps: true,
        underscored: true
    }
}