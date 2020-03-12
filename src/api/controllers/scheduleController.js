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

        for (let index in batteries) {

            req.connection.beginTransaction(function (err) {

                if (err) {
                    return req.connection.rollback(function () {
                        return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                    })
                }

                const query = `
                        SELECT
                            ABS(COUNT(s.id) - b.people_allowed) AS available_vacancies
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
                            b.id`

                const filters = [
                    date,
                    SCHEDULE_STATUS.CANCELED,
                    batteries[index].id
                ]

                req.connection.query(query, filters, function (err, results, fields) {

                    if (err) {
                        return req.connection.rollback(function () {
                            return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                        })
                    }

                    let available_vacancies = results[0].available_vacancies

                    //  TODO: Handle canceled batteries
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
                                        NOW())`

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
                            message: "Não foi possível realizar o agendamento, tente novamente!",
                            verbose: null,
                            data: {}
                        })

                    }

                })

            })

        }

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
    }

}

exports.pay = async function (req, res) {

    const scheduleId = req.params.schedule_id

    try {

        let sql = ` 
            SELECT 1
            FROM schedules
            WHERE 
                id = ?
                AND status_id NOT IN (?)
        `

        let sqlParams = [
            scheduleId,
            SCHEDULE_STATUS.CANCELED
        ]

        req.connection.query(sql, sqlParams, function (err, result, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao atualizar o pagamento!", err)

            if (result.length == 0) {

                return res.status(400).json({
                    success: false,
                    message: "Não foi possível registrar o pagamento, pois o agendamento está cancelado!",
                    verbose: null,
                    data: {}
                })

            }

            req.connection.beginTransaction(function (err) {

                if (err)
                    return handleError(req, res, 500, "Ocorreu um erro ao atualizar o pagamento!", err)

                sql = ` 
                        UPDATE 
                            schedules 
                        SET 
                            status_id = ?, 
                            updated_at = NOW() 
                        WHERE 
                            id = ?
                    `

                sqlParams = [
                    SCHEDULE_STATUS.PAID,
                    scheduleId
                ]

                req.connection.query(sql, sqlParams, function (err, result, _) {

                    if (err) {
                        return req.connection.rollback(function () {
                            return handleError(req, res, 500, "Ocorreu um erro ao atualizar o pagamento!", err)
                        })
                    }

                    req.connection.commit(function (err) {

                        if (err) {
                            return req.connection.rollback(function () {
                                handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                            })
                        }

                        return res.status(200).json({
                            success: true,
                            message: "Pagamento registrado com sucesso!",
                            verbose: null,
                            data: {}
                        })

                    })

                })

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao atualizar o pagamento!", err)
    }

}