const UserAddress = require('../models/UserAddress')

const validator = require('../classes/validator')

exports.findByCEP = function (req, res) {

    let cep = req.params.cep

    req.assert('cep', 'O CEP deve ser informado').notEmpty()
    req.assert('cep', 'CEP inválido').len(8)

    validator.validateFiels(req, res)

    address.findByCEP(cep, function (address) {

        if (address) {

            return res.status(200).json({
                success: true,
                message: "Endereço encontrado com sucesso!",
                verbose: null,
                data: { address }
            })

        }

    })

}

exports.store = async function (req, res) {

    let user_id = req.params.user_id
    let zipcode = req.body.cep
    let country = req.body.country
    let state = req.body.state
    let city = req.body.city
    let neighbourhood = req.body.neighbourhood
    let street = req.body.street
    let number = req.body.number
    let complement = req.body.complement
    
    req.assert('cep', 'O CEP deve ser informado').notEmpty()
    req.assert('cep', 'O CEP está inválido').len(8)
    req.assert('country', 'O País deve ser informado').notEmpty()
    req.assert('state', 'O Estado ser informado').notEmpty()
    req.assert('city', 'A Cidade deve ser informado').notEmpty()
    req.assert('neighbourhood', 'O Bairro deve ser informado').notEmpty()
    req.assert('street', 'A Rua deve ser informado').notEmpty()
    req.assert('number', 'O Número deve ser informado').notEmpty()

    validator.validateFiels(req, res)

    await UserAddress.create(
        {
            zipcode,
            country,
            state,
            city,
            neighbourhood,
            street,
            number,
            complement,
            user_id,
        }
    ).then(address => {

        return res.status(200).json({
            success: true,
            message: "Endereço registrado com sucesso!",
            verbose: null,
            data: address
        })

    }).catch(err => {

        return res.status(500).json({
            success: false,
            message: "Ops, algo ocorreu. Tente novamente mais tarde!",
            verbose: `${err}`,
            data: {}
        })

    })

}
