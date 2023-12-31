import { Client } from 'pg'
const { handleError } = require('../../common/classes/error-handler')
const { minutesRestriction } = require('../../common/classes/time-restriction')
const { SCHEDULE_STATUS } = require('../../common/classes/constants')

exports.store = async function (req, res) {
    const client = new Client()
    const date = req.body.date
    const batteries = req.body.batteries

    const userId = req.decoded.data.userId

    if (userId === undefined) {
        return res.status(404).json({
            success: false,
            message: "Token inválido, favor tentar logar novamente!",
            verbose: null,
            data: {}
        })
    }

    try {
        await client.connect()

        let batteryQuery = `
            SELECT  
                1
            FROM batteries b
            INNER JOIN battery_weekdays bw 
                ON bw.battery_id = b.id
            INNER JOIN weekday w
                ON w.id = bw.weekday_id
            WHERE 
                b.id IN (?)
                AND b.deleted = false
                AND w.day = LOWER(DATE_FORMAT(?, "%W"))
                AND (
                    NOW() > b.end_hour 
                    AND ? = DATE_FORMAT(NOW(), "%Y-%m-%d")
                )
            GROUP By b.id;
        `

        let batteryParams = [
            batteries.map(battery => battery.id),
            date,
            minutesRestriction,
            date
        ]

        const batteriesResult = await client.query(batteryQuery, batteryParams);

        if (batteriesResult.length > 0) {

            return res.status(404).json({
                success: false,
                message: "Não foi possível realizar o agendamento, a bateria já encerrou.",
                verbose: null,
                data: {}
            })

        }

        for (battery of batteries) {

            const insertQuery = `
                CALL user_schedule(?, ?, ?, ?, @scheduleId, @callback); 
                SELECT @scheduleId AS scheduleId, @callback AS callback;
            `

            const insertParams = [
                battery.id,
                date,
                userId,
                battery.clientLevel
            ]

            const insertResult = await client.query(insertQuery, insertParams)
            let callback = insertResult[1][0].callback
            let scheduleId = insertResult[1][0].scheduleId

            if (callback != null) {

                await client.query('ROLLBACK')

                return res.status(404).json({
                    success: false,
                    message: callback,
                    verbose: null,
                    data: {}
                })

            }

            let equipmentQuery = `
                INSERT INTO schedule_equipments
                (
                    schedule_id,
                    equipment_id
                )
                VALUES
                (
                    ?,
                    ?
                )   
            `

            if (battery.equipments != undefined) {
                let equipments = battery.equipments
                for (equipment of equipments) {

                    let equipmentParams = [
                        scheduleId,
                        equipment.equipmentBatteryId
                    ]

                    await client.query(equipmentQuery, equipmentParams)
                }
            }

        }

        await client.query('COMMIT')

        return res.status(200).json({
            success: true,
            message: "Agendamento realizado com sucesso!",
            verbose: null,
            data: {}
        })

    } catch (err) {
        await client.query('ROLLBACK')
        return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
    } finally {
        await client.end()
    }

}