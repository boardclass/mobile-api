module.exports = {
    dialect: 'postgres',
    URI: process.env.SQL_URI || 'URI',
    host: process.env.SQL_HOST || 'dpg-cibdb4t9aq03rjn2c9ag-a.oregon-postgres.render.com',
    username: process.env.SQL_USERNAME || 'boardclass',
    password: process.env.SQL_PASSWORD || 'TWwUIExXr5MHAfkgEyTlp6crwvDQ8Zb0',
    database: process.env.SQL_DATABASE || 'boardclass',
    connectionLimit: 10,
    port: process.env.SQL_PORT || 3306,
    define: {
        timestamps: true,
        underscored: true
    }
}