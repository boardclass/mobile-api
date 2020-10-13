const bcrypt = require('bcryptjs')

module.exports = {

    hash: function (res, password) {

        const hashed = bcrypt.hash(password, 10)
            .then(hash => {
                return hash
            })
            .catch(err => {

                return res.status(500).json({
                    data: {},
                    error: {
                        message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                        verbose: err
                    }
                })

            })

    }

}