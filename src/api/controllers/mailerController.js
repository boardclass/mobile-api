const mailer = require('../classes/mailer')
const logger = require('../classes/logger')

exports.send = async function (req, res) {

    const data = {
        destination: req.body.destination,
        subject: req.body.subject,
        message: req.body.message
    }

    await mailer.send(data, callback => {

        if (callback == null) {

            logger.register(error, req, _ => {

                return res.status(500).json({
                    success: false,
                    message: "Falha ao enviar email!",
                    verbose: null,
                    data: {}
                })

            })

        }

        return res.status(200).json({
            success: true,
            message: "Email enviado com sucesso!",
            verbose: null,
            data: {}
        })

    })

}