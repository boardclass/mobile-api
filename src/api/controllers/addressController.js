const validator = require('../classes/validator')
const addressRequest = require('../requests/address')

exports.findByCEP = function (req, res) {

    let cep = req.params.cep

    req.assert('cep', 'O CEP deve ser informado').notEmpty()
    req.assert('cep', 'CEP inválido').len(8)

    validator.validateFiels(req, res)

    addressRequest.findByCEP(cep, function (address) {

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
