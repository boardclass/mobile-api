const { minutesRestriction } = require('../classes/time-restriction')
const { handleError } = require('../classes/error-handler')
const { SCHEDULE_STATUS } = require('../classes/constants')

exports.store = async function (req, res) {

    const date = req.body.date
    const userId = req.decoded.data.userId
    const batteries = req.body.batteries

    if (userId === undefined) {
        return res.status(404).json({
            success: false,
            message: "Token inválido, favor tentar logar novamente!",
            verbose: null,
            data: {}
        })
    }

    try {

        // TODO: fix battery_weekdays excluded, maybe insert isdelete on database
        let query = `
            SET @@session.time_zone = '-03:00';

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
                    DATE_ADD(NOW(), INTERVAL ? MINUTE) > b.start_hour 
                    AND ? = DATE_FORMAT(NOW(), "%Y-%m-%d")
                    )
            GROUP By b.id;
        `

        const batteriesIds = batteries.map(battery => battery.id);

        let queryParams = [
            batteriesIds,
            date,
            minutesRestriction,
            date
        ]

        req.connection.beginTransaction(function (err) {

            if (err) {
                return req.connection.rollback(function () {
                    return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                })
            }

            req.connection.query(query, queryParams, function (err, result, _) {

                if (err) {
                    return req.connection.rollback(function () {
                        return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                    })
                }

                if (result[1] && result[1].length > 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Não foi possível realizar o agendamento, é preciso agendar com até duas horas de antecência.",
                        verbose: null,
                        data: {}
                    })

                }

                for (let index in batteries) {

                    if (err) {
                        return req.connection.rollback(function () {
                            return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                        })
                    }

                    query = `
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

                    const filters = [
                        date,
                        SCHEDULE_STATUS.CANCELED,
                        batteries[index].id
                    ]

                    req.connection.query(query, filters, function (err, results, _) {

                        if (err) {
                            return req.connection.rollback(function () {
                                return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                            })
                        }

                        let available_vacancies = results[0].available_vacancies

                        if (available_vacancies != 0 && available_vacancies >= batteries[index].selectedVacancies) {

                            for (i = 0; i < batteries[index].selectedVacancies; i++) {

                                const query = `
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

                                const filters = [
                                    batteries[index].id,
                                    userId,
                                    SCHEDULE_STATUS.PENDENT_PAYMENT,
                                    date
                                ]

                                req.connection.query(query, filters, function (err, results, fields) {

                                    if (err) {
                                        return req.connection.rollback(function () {
                                            return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                                        })
                                    }

                                })

                            }

                            if (index == batteries.length - 1) {

                                req.connection.commit(function (err) {

                                    if (err) {
                                        req.connection.rollback(function () {
                                            return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                                        })
                                    }

                                })

                                return res.status(200).json({
                                    success: true,
                                    message: "Agendamento realizado com sucesso!",
                                    verbose: null,
                                    data: {}
                                })
                            }

                        } else {

                            return res.status(404).json({
                                success: false,
                                message: "Não foi possível realizar o agendamento, pois não há vagas disponíveis para essa bateria!",
                                verbose: null,
                                data: {}
                            })

                        }

                    })

                }

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
    }

}