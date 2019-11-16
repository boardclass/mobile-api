const User = require('../models/User')

const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')

exports.login = async function (req, res) {

    let email = req.body.email
    let password = req.body.password

    req.assert('email', 'O email deve ser informado')
    req.assert('password', 'A senha deve ser informado')

    validator.validateFiels(req, res)

    User.findOne({ "account.email": email })
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

exports.store = async function (req, res) {

    let body = req.body

    req.assert('name', 'O nome deve ser informado').notEmpty()
    req.assert('cpf', 'O CPF deve ser informado').notEmpty()
    req.assert('cpf', 'O CPF está com formato inválido').len(11)
    req.assert('phone', 'O telefone deve ser informado').notEmpty()
    req.assert('phone', 'O telefone está com formato inválido').len(13)
    req.assert('account.roleId', 'A permissão do usuário deve ser informada').notEmpty()
    req.assert('account.email', 'O email deve ser informado').notEmpty()
    req.assert('account.password', 'A senha deve ser informada').notEmpty()

    validator.validateFiels(req, res)

    const token = jwtHandler.generate(body.account.email)
    res.set('access-token', token)

    await bcrypt.hash(body.account.password, 10)
        .then(hash => {

            body.account.password = hash

            User.findOrCreate({
                where: {
                    cpf: body.cpf
                },
                defaults: {
                    name: body.name,
                    phone: body.phone
                }
            }).then((user, created) => {

                res.set('user-id', user[0].id)

                if (!created) {

                    return res.status(201).json({
                        success: true,
                        message: "Usuário já cadastrado em nossa base!",
                        verbose: null,
                        data: {
                            userId: user[0].id,
                            hasAddress: false
                        }
                    })

                }

                res.set('user-id', user[0].id)

                return res.status(200).json({
                    success: false,
                    message: "Usuário cadastrado com sucesso!",
                    verbose: null,
                    data: {
                        userId: user[0].id,
                        hasAddress: true
                    }
                })

            }).catch(error => {

                return res.status(500).json({
                    success: false,
                    message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                    verbose: `${error}`,
                    data: {}
                })

            })

        }).catch(error => {

            return res.status(500).json({
                success: false,
                message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                verbose: `${error}`,
                data: {}
            })

        })

}