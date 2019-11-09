require('../models/establishment')
const mongoose = require('mongoose')
const EstablishmentModel = mongoose.model('establishment')
const validator = require('../classes/validator')
const bcrypt = require('bcrypt')
const jwt = require('../classes/jwt')

module.exports = {

    signup: async function (req, res) {

        let establishment = new EstablishmentModel(req.body)
        let account = establishment.account

        req.assert('name', 'O nome do estabelecimento deve ser informado').notEmpty()
        req.assert('cnpj', 'O cnpj deve ser informado').notEmpty()
        req.assert('cnpj', 'O cnpj está inválido').len(14)
        req.assert('phone', 'O número do telefone deve ser informado').notEmpty()
        req.assert('phone', 'O número do telefone é inválido').isLength({ min: 8, max: 11 })
        req.assert('account.role', 'O tipo de usuário deve ser informado').notEmpty()
        req.assert('account.email', 'O email deve ser informado').notEmpty()
        req.assert('account.password', 'A senha deve ser informado').notEmpty()
        req.assert('address.cep', 'O CEP deve ser informado').notEmpty()
        req.assert('address.cep', 'O CEP está inválido').len(8)
        req.assert('address.country', 'O País deve ser informado').notEmpty()
        req.assert('address.state', 'O Estado ser informado').notEmpty()
        req.assert('address.city', 'A Cidade deve ser informado').notEmpty()
        req.assert('address.neighbourhood', 'O Bairro deve ser informado').notEmpty()
        req.assert('address.street', 'A Rua deve ser informado').notEmpty()
        req.assert('address.number', 'O Número deve ser informado').notEmpty()

        validator.validateFiels(req, res)

        const token = jwt.generate(account.email)
        res.set('access-token', token)

        await bcrypt.hash(account.password, 10)
            .then(hash => {

                account.password = hash
                establishment.account = account

                const query = EstablishmentModel.findOne()
                    .or([
                        { cnpj: establishment.cnpj },
                        { phone: establishment.phone },
                        { 'account.email': account.email }
                    ])

                query.exec(function (error, result) {

                    if (error) {

                        return res.status(500).json({
                            success: false,
                            message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                            verbose: error,
                            data: {}
                        })

                    }

                    if (result) {

                        res.set('user-id', result.id)

                        return res.status(202).json({
                            success: true,
                            message: "Estabelecimento já cadastrado!",
                            verbose: '',
                            data: {
                                userId: result.id
                            }
                        })

                    }

                    establishment.save({}, function (error, result) {

                        if (error) {

                            return res.status(500).json({
                                success: false,
                                message: "Ops, algo ocorreu ao registrar o estabelecimento!",
                                verbose: error,
                                data: {}
                            })

                        }

                        res.set('user-id', result.id)

                        return res.status(200).json({
                            success: true,
                            message: "Estabelecimento cadastrado com sucesso",
                            verbose: "",
                            data: {
                                userId: result.id
                            }
                        })

                    })

                })

            })
            .catch(err => {

                return res.status(500).json({
                    success: false,
                    message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                    verbose: err,
                    data: {}
                })

            })

    },

    login: function (req, res) {

        let email = req.body.email
        let password = req.body.password

        req.assert('email', 'O email deve ser informado')
        req.assert('password', 'A senha deve ser informado')

        validator.validateFiels(req, res)

        EstablishmentModel.findOne({ "account.email": email })
            .then(establishment => {

                if (!establishment) {

                    return res.status(404).json({
                        success: false,
                        message: "Este email não está cadastrado!",
                        verbose: "",
                        data: {}
                    })

                }

                let hashedPassword = establishment.account.password

                bcrypt.compare(password, hashedPassword)
                    .then(match => {

                        const token = jwt.generate(email)

                        if (match) {

                            res.setHeader('access-token', token)
                            res.setHeader('user-id', establishment._id)

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

    },

    establishmentsAddress: function (req, res) {

        EstablishmentModel.find()
            .where('attendanceAddress').exists(true)
            .then(establishments => {

                if (establishments.length === 0) {

                    return res.status(404).json({
                        success: true,
                        message: "Não há estabelecimentos disponíveis no momento!",
                        verbose: null,
                        data: null
                    })

                }  


                let establishmentsResponse = []

                for (establishment in establishments) {
                    console.log(establishment)
                    establishmentsResponse.push = {
                        establishmentId: establishment._id,
                        attendanceAddress: establishment.attendanceAddress
                    }
                }

                return res.status(200).json({
                    success: true,
                    message: "Estabelecimentos listado com sucesso!",
                    verbose: null,
                    data: { establishments: establishmentsResponse }
                })

            }).catch(error => {

                return res.status(500).json({
                    success: false,
                    message: "Erro ao listar os estabelecimentos!",
                    verbose: error,
                    data: null
                })

            })

    },

    registerAttendanceAddress: function (req, res) {

        const address = req.body.address
        const userId = req.headers['user-id']

        req.assert('userId', 'O User-Id deve ser informado')
        req.assert('address.cep', 'O CEP deve ser informado').notEmpty()
        req.assert('address.cep', 'O CEP está inválido').len(8)
        req.assert('address.country', 'O País deve ser informado').notEmpty()
        req.assert('address.state', 'O Estado ser informado').notEmpty()
        req.assert('address.city', 'A Cidade deve ser informado').notEmpty()
        req.assert('address.neighbourhood', 'O Bairro deve ser informado').notEmpty()
        req.assert('address.street', 'A Rua deve ser informado').notEmpty()
        req.assert('address.number', 'O Número deve ser informado').notEmpty()

        validator.validateFiels(req, res)

        EstablishmentModel.findById(userId)
            .then(establishment => {

                if (establishment.attendanceAddress.some(e => e === address)) {

                    return res.status(202).json({
                        success: false,
                        message: "Endereço já se encontra cadastradado!",
                        verbose: null,
                        data: null
                    })

                }

                if (establishment.attendanceAddress) {
                    establishment.attendanceAddress.push(address)
                } else {
                    establishment.attendanceAddress = [address]
                }

                establishment.save()
                    .then(_ => {

                        return res.status(201).json({
                            success: true,
                            message: "Endereço salvo com sucesso!",
                            verbose: null,
                            data: null
                        })

                    }).catch(error => {

                        return res.status(500).json({
                            success: false,
                            message: "Ocorreu um erro ao salvar o endereço!",
                            verbose: error,
                            data: null
                        })

                    })

            }).catch(error => {

                return res.status(500).json({
                    success: false,
                    message: "Ocorreu um erro ao salvar o endereço!",
                    verbose: error,
                    data: null
                })

            })

    }

}
