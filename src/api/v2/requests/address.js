const request = require('request')
const logger = require('../../common/classes/logger')

exports.findByCEP = function (cep, callback) {

    let link = `https://viacep.com.br/ws/${cep}/json/`;

    request(link, function (error, response, body) {

        if (error) {

            return res.status(500).json({
                success: false,
                message: 'Ops, algo ocorreu. Tente novamente mais tarde!',
                verbose: error,
                data: {}
            })

        }

        if (body) {

            let json = JSON.parse(body);

            let address = {
                cep: json.cep,
                street: json.logradouro,
                neighbourhood: json.bairro,
                city: json.localidade,
                state: json.uf,
                country: 'Brasil'
            };

            callback(address)
            return
        }

        logger.register(error, req, _ => {

            return res.status(500).json({
                success: false,
                message: 'Ops, algo ocorreu. Tente novamente mais tarde!',
                verbose: 'The response from service has no body',
                data: {}
            })

        })

    });

};