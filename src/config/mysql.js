// module.exports = {
//     dialect: 'mysql',
//     uri: process.env.JAWSDB_URL || 'mysql://root:@localhost/board_class',
//     host: 'localhost',
//     username: 'root',
//     database: 'board_class',
//     define: {
//         timestamps: true,
//         underscored: true
//     }
// }

module.exports = {
    dialect: 'mysql',
    uri: process.env.JAWSDB_URL,
    define: {
        timestamps: true,
        underscored: true
    }
}