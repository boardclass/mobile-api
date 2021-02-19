const mailer = require('../../common/classes/mailer')
const logger = require('../../common/classes/logger')
 
exports.send = function (req, res) {

    const data = {
        destination: req.body.destination,
        subject: req.body.subject,
        message: req.body.message
    }

    mailer.send(data, (error, result) => {

        if (error) {

            return res.status(500).json({
                success: false,
                message: "Falha ao enviar email!",
                verbose: error,
                data: {}
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