const validator = require('../../common/classes/validator')
const addressRequest = require('../requests/address')

exports.findByCEP = function (req, res) {

    let cep = req.params.cep

    req.assert('cep', 'O CEP deve ser informado').notEmpty()
    req.assert('cep', 'CEP inválido').len(8)

    if (validator.validateFields(req, res) != null) {
        return
    }

    addressRequest.findByCEP(cep, function (address) {

        if (address.cep === undefined) {

            return res.status(404).json({
                success: true,
                message: "CEP não encontrado, necessário inserir o endereço manualmente!",
                verbose: null,
                data: {}
            })

        }

        return res.status(200).json({
            success: true,
            message: "CEP encontrado com sucesso!",
            verbose: null,
            data: { address }
        })

    })

}
