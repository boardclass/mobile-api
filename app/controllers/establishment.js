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

    }

}
