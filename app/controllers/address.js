const address = require('../requests/address')

module.exports = {

    findByCEP: function (req, res) {

        let cep = req.params.cep;

        req.assert('cep', 'O CEP deve ser informado').notEmpty()
        req.assert('cep', 'CEP inválido').len(8)

        let error = req.validationErrors()

        if (error) {

            let message = error[0].msg;
            return res.status(400).json({
                success: false,
                message: message,
                verbose: error[0],
                data: {}
            })

        }

        address.findByCEP(cep, function (address) {

            if (address) {

                return res.status(200).json({
                    success: true,
                    message: "Endereço encontrado com sucesso!",
                    verbose: "Address find",
                    data: { address }
                })

            }

        })

    }

}
