module.exports = pool => (req, res, next) => {

    pool.getConnection((err, connection) => {
        if (err) return next(err)
        console.log('pool => obteve conexão')
        req.connection = connection

        res.on('finish', () => req.connection.release())
        next() 
    })
    
}