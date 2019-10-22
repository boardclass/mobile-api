require('../models/user')

const mongoose = require('mongoose')
const UserModel = mongoose.model('User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const jwtEnv = require('../../setup/jwt')

exports.login = async function (req, res) {

    let email = req.body.email
    let password = req.body.password

    req.assert('email', 'O email deve ser informado')
    req.assert('password', 'A senha deve ser informado')

    let error = req.validationErrors()

    if (error) {

        let message = error[0].msg
        return res.status(400).json({
            success: false,
            message: message,
            verbose: error[0],
            data: {}
        })

    }

    UserModel.findOne({ "account.email": email })
        .then(user => {

            if (!user) {

                return res.status(404).json({
                    success: false,
                    message: "Este email não está cadastrado!",
                    verbose: "",
                    data: {}
                })

            }

            let hashedPassword = user.account.password

            bcrypt.compare(password, hashedPassword)
                .then(match => {

                    const token = jwt.sign({ email }, jwtEnv.secret, {
                        algorithm: 'HS256',
                        expiresIn: jwtEnv.expirationSeconds
                      })
                      console.log('token:', token)

                    if (match) {

                        return res.status(200).json({
                            success: true,
                            message: "Login realizado com sucesso!",
                            verbose: "",
                            data: { token: token }
                        })

                    }

                    return res.status(400).json({
                        success: false,
                        message: "Não foi possível realizar o login, senha incorreta!",
                        verbose: "",
                        data: {}
                    })

                })

        }).catch(err => {

            return res.status(500).json({
                success: false,
                message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                verbose: err,
                data: {}
            })

        })

}