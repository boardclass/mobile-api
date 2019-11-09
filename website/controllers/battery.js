module.exports = {

    getBatteryView: function (req, res, root) {
        res.render('create-battery')
    },

    createBattery: function (req, res, root) {
        
        let errors = []

        const battery = {
            startHour: req.body.startHour,
            finishHour: req.body.finishHour,
            amountClient: req.body.amountClient,
            session: {
                time: req.body.session.time,
                value: req.body.session.value
            },
            addressId: req.body.addressId
        }

        if (finishHour <= startHour) {
            errors.push({ text: 'A hora de término deve ser maior que a de início!' })
        }

        if (errors.length > 0) {
            res.render("")
        }

    }

}