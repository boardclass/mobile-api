const mysql = require('../../config/mysql')
const { SCHEDULE_STATUS, AGENDA_STATUS } = require('../classes/constants')

exports.store = async function (req, res) {

    const date = req.body.date
    const userId = req.decoded.userId
    const batteries = req.body.batteries

    try {

        mysql.connect(mysql.uri, connection => {

            for (let index in batteries) {

                connection.beginTransaction(function (err) {

                    const query = `
                        SELECT
                            ABS(COUNT(s.id) - b.people_allowed) AS available_vacancies
                        FROM
                            batteries b
                        LEFT JOIN schedules s ON
                            s.battery_id = s.id
                            AND s.status_id NOT IN (?)
                        WHERE
                            b.id = ?
                        GROUP BY 
                            b.id`

                    const filters = [
                        SCHEDULE_STATUS.CANCELED,
                        batteries[index].id
                    ]

                    connection.query(query, filters, function (err, results, fields) {

                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: "Ocorreu um erro no agendamento!",
                                verbose: `${err}`,
                                data: {}
                            })
                        }

                        var insertedIds = []
                        let available_vacancies = results[0].available_vacancies

                        //  TODO: Handle canceled batteries
                        if (available_vacancies != 0 && available_vacancies >= batteries[index].selectedVacancies) {

                            for (i = 0; i < batteries[index].selectedVacancies; i++) {

                                connection.query(
                                    `INSERT INTO 
                                    schedules
                                        (battery_id, 
                                        user_id, 
                                        status_id, 
                                        created_at, 
                                        updated_at)
                                    VALUES
                                        (${batteries[index].id}, 
                                        ${userId}, 
                                        ${SCHEDULE_STATUS.SCHEDULED}, 
                                        NOW(), 
                                        NOW())`,
                                    function (err, results, fields) {

                                        if (err) {

                                            connection.rollback(function () {

                                                return res.status(500).json({
                                                    success: false,
                                                    message: "Ocorreu um erro no agendamento!",
                                                    verbose: `${err}`,
                                                    data: {}
                                                })

                                            })

                                            connection.end()

                                        }

                                        insertedIds.push(results.insertId)

                                    })

                            }

                            if (index == batteries.length - 1) {

                                connection.commit(function (err) {
                                    if (err) {

                                        connection.rollback(function () {

                                            return res.status(500).json({
                                                success: false,
                                                message: "Ocorreu um erro no agendamento!",
                                                verbose: `${err}`,
                                                data: {}
                                            })

                                        })
                                    }

                                    connection.end()
                                })

                                return res.status(200).json({
                                    success: true,
                                    message: "Agendado com sucesso!",
                                    verbose: null,
                                    data: {
                                        schedules_id: insertedIds
                                    }
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



        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro no agendamento!",
            verbose: `${error}`,
            data: {}
        })

    }

}