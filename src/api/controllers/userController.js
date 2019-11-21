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

    await User.findOne({
        include: {
            association: 'account',
            where: {
                'email': email
            }
        }
    }).then(user => {

        if (!user) {

            return res.status(404).json({
                success: true,
                message: "Este email não está cadastrado em nosso sistema!",
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
                    res.setHeader('user-id', user.id)

                    return res.status(200).json({
                        success: true,
                        message: "Login realizado com sucesso!",
                        verbose: "",
                        data: {}
                    })

                }

                return res.status(404).json({
                    success: false,
                    message: "Não foi possível realizar o login, senha incorreta!",
                    verbose: "",
                    data: {}
                })

            })

    }).catch(error => {

        return res.status(500).json({
            success: false,
            message: "Não foi possível realizar o login!",
            verbose: `${error}`,
            data: {}
        })

    })

}

exports.store = async function (req, res) {

    const user = req.body
    const account = req.body.account

    req.assert('name', 'O nome deve ser informado').notEmpty()
    req.assert('cpf', 'O CPF deve ser informado').notEmpty()
    req.assert('cpf', 'O CPF está com formato inválido').len(11)
    req.assert('phone', 'O telefone deve ser informado').notEmpty()
    req.assert('phone', 'O telefone está com formato inválido').len(13)
    req.assert('account.roleId', 'A permissão do usuário deve ser informada').notEmpty()
    req.assert('account.email', 'O email deve ser informado').notEmpty()
    req.assert('account.password', 'A senha deve ser informada').notEmpty()

    validator.validateFiels(req, res)

    const token = jwtHandler.generate(account.email)
    res.set('access-token', token)

    await bcrypt.hash(account.password, 10)
        .then(hash => {

            account.password = hash

            User.findOrCreate({
                where: {
                    cpf: user.cpf
                },
                defaults: {
                    name: user.name,
                    phone: user.phone,
                    account: account
                },
                include: {
                    association: 'account'
                }
            }).then((user, _) => {

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