const { handleError } = require('../classes/error-handler')

module.exports = {

    insertEquipments: async function (req, res, batteryId) {

        let equipments = req.body.equipments

        for (index in equipments) {

            let query = `
                    INSERT INTO battery_equipments
                    (
                        equipment_id,
                        description,
                        price,
                        battery_id
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?
                    )   
                `

            let queryValues = [
                equipments[index].id,
                equipments[index].description,
                equipments[index].price,
                batteryId
            ]

            req.connection.query(query, queryValues, function (err, _, _) {

                if (err) {
                    req.connection.rollback(function () {
                        handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                    })
                }

                if (index == equipments.length - 1) {
                    return;
                }

            })

        }

    },

    removeEquipments: async function (req, res, scheduleId, equipments) {

    },

    createScheduleEquipments: async function (req, res, scheduleId, equipment) {

        let query = `
            INSERT INTO schedule_equipments
            (
                schedule_id,
                equipment_id
            )
            VALUES
            (
                ?,
                ?,
                ?
            )   
        `

        let queryValues = [
            scheduleId,
            equipment.equipmentBatteryId
        ]

        req.connection.query(query, queryValues, function (err, _, _) {

            if (err) {
                req.connection.rollback(function () {
                    handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                })
            }

            return;

        })

    }

}