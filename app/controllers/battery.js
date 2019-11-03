require('../models/battery')
require('../models/user')
require('../models/establishment')
const mongoose = require('mongoose')
const validator = require('../classes/validator')
const EstablishmentModel = mongoose.model('establishment')

module.exports = {

    create: function (req, res) {

        const userId = req.params.userid
        const battery = req.body

        req.assert('startHour', 'A hora de ínicio deve ser informado').notEmpty()
        req.assert('finishHour', 'A hora de ínicio deve ser informado').notEmpty()
        req.assert('amountClient', 'O número máximo de clientes deve ser informado').notEmpty()
        req.assert('session.time', 'O tempo da sessão ser informado').notEmpty()
        req.assert('session.value', 'O valor da sessão deve ser informado').notEmpty()
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

                establishment.batteries.push(battery)

                establishment.save()
                    .then(_ => {

                        return res.status(201).json({
                            success: true,
                            message: "Bateria cadastrada com sucesso!",
                            verbose: null,
                            data: null
                        })

                    }).catch(error => {

                        return res.status(500).json({
                            success: false,
                            message: "Não foi possível salvar a bateria!",
                            verbose: error,
                            data: null
                        })

                    })

            }).catch(error => {

                return res.status(500).json({
                    success: false,
                    message: "Não foi possível localizar o estabelecimento!",
                    verbose: error,
                    data: null
                })

            })

    }

}