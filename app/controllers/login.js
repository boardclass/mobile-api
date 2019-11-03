require('../models/user')

const mongoose = require('mongoose')
const UserModel = mongoose.model('User')
const bcrypt = require('bcrypt')
const jwtHandler = require('../classes/jwt')

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

                    const token = jwtHandler.generate(email)

                    if (match) {

                        res.setHeader('access-token', token)
                        res.setHeader('user-id', user._id)

                        return res.status(200).json({
                            success: true,
                            message: "Login realizado com sucesso!",
                            verbose: "",
                            data: {}
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