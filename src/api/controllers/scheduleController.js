const mysql = require('../util/connection')
const { handleError } = require('../classes/error-handler')
const { minutesRestriction } = require('../classes/time-restriction')
const { SCHEDULE_STATUS } = require('../classes/constants')

exports.store = async function (req, res) {

    const date = req.body.date
    const batteries = req.body.batteries

    const userId = req.decoded.data.userId
    const connection = await mysql.connection()

    if (userId === undefined) {
        return res.status(404).json({
            success: false,
            message: "Token inválido, favor tentar logar novamente!",
            verbose: null,
            data: {}
        })
    }

    try {

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

        const batteriesResult = await connection.query(batteryQuery, batteryParams);

        if (batteriesResult.length > 0) {

            return res.status(404).json({
                success: false,
                message: "Não foi possível realizar o agendamento, a bateria já encerrou.",
                verbose: null,
                data: {}
            })

        }

        for (battery of batteries) {

            const vacanciesQuery = `
                SELECT
                    b.start_hour,
                    b.people_allowed - COUNT(s.id) AS available_vacancies
                FROM
                    batteries b
                LEFT JOIN schedules s ON
                    s.battery_id = b.id
                    AND s.date = ?
                    AND s.status_id NOT IN (?)
                    AND b.deleted = false
                WHERE
                    b.id = ?
                GROUP BY 
                    b.id
            `

            const vacanciesParams = [
                date,
                SCHEDULE_STATUS.CANCELED,
                battery.id
            ]

            const vacanciesResult = await connection.query(vacanciesQuery, vacanciesParams)
            const availablevacancies = vacanciesResult[0].available_vacancies

            if (availablevacancies > 0) {

                const scheduleQuery = `
                    INSERT INTO schedules
                        (battery_id, 
                        user_id, 
                        status_id, 
                        date,
                        created_at, 
                        updated_at)
                    VALUES
                        (?, 
                        ?, 
                        ?, 
                        ?,
                        NOW(), 
                        NOW())
                `

                const scheduleParams = [
                    battery.id,
                    userId,
                    SCHEDULE_STATUS.PENDENT_PAYMENT,
                    date
                ]

                const scheduleResult = await connection.query(scheduleQuery, scheduleParams)

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
                            scheduleResult.insertId,
                            equipment.equipmentBatteryId
                        ]
    
                        await connection.query(equipmentQuery, equipmentParams)
    
                    }

                }

            } else {

                await connection.query('ROLLBACK')

                return res.status(404).json({
                    success: false,
                    message: "Não foi possível realizar o agendamento, pois não há vagas disponíveis para essa bateria!",
                    verbose: null,
                    data: {}
                })

            }

        }

        await connection.query('COMMIT')

        return res.status(200).json({
            success: true,
            message: "Agendamento realizado com sucesso!",
            verbose: null,
            data: {}
        })

    } catch (err) {
        await connection.query('ROLLBACK')
        return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
    } finally {
        await connection.release()
    }

}