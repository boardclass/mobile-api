module.exports = {
    dialect: 'mysql',
    uri: process.env.JAWSDB_URL || 'mysql://boardclass:Bo@rd@app@mysql.boardclass.kinghost.net:3306/boardclass',
    host: process.env.SQL_HOST || 'mysql.boardclass.kinghost.net',
    username: process.env.SQL_USERNAME || 'boardclass',
    password: process.env.SQL_PASSWORD || 'Bo@rd@app',
    database: process.env.SQL_DATABASE || 'boardclass',
    connectionLimit: 10,
    port: process.env.SQL_PORT || 3306,
    define: {
        timestamps: true,
        underscored: true
    }
}