const validator = require('../classes/validator')

module.exports = {

    getScheduleByEstablishment: function (req, res) {

        const establishmentId = req.params.establishmentId

        EstablishmentModel.findById(establishmentId)
            .where('schedule').exists(true)
            .then(establishment => {

                if (!establishment.schedule) {

                    return res.status(404).json({
                        success: false,
                        message: 'Agenda não encontrada!',
                        verbose: null,
                        data: null
                    })

                }

                return res.status(200).json({
                    success: true,
                    message: 'Agenda listada com sucesso!',
                    verbose: null,
                    data: { schedule: establishment.schedule }
                })

            }).catch(error => {

                return res.status(500).json({
                    success: false,
                    message: 'Não foi possível recuperar a agenda!',
                    verbose: error,
                    data: null
                })

            })

    }

}
