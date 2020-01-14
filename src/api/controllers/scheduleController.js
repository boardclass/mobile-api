const mysql = require('../../config/mysql')
const { SCHEDULE_STATUS, AGENDA_STATUS } = require('../classes/constants')

exports.store = async function (req, res) {

    const agendaId = req.body.agendaId
    const batteryId = req.body.batteryId
    const userId = req.body.userId
    const date = req.body.date

    try {

        mysql.connect(mysql.uri, connection => {

            var agendaDayId = null

            connection.query(
                `SELECT id AS agenda_day_id
                FROM agenda_dates 
                WHERE date = '${date}'`,
                function (err, results, fields) {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Ocorreu um erro no agendamento!",
                            verbose: `${err}`,
                            data: {}
                        })
                    }

                    if (!results.length) {

                        const query = `
                            INSERT INTO agenda_dates 
                                (agenda_id, date, status_id, created_at, updated_at)
                            VALUES 
                                (${agendaId}, '${date}', ${AGENDA_STATUS.AVAILABLE}, NOW(), NOW())`

                        connection.query(
                            query,
                            function (err, results, fields) {

                                if (err) {
                                    return res.status(500).json({
                                        success: false,
                                        message: "Ocorreu um erro no agendamento!",
                                        verbose: `${err}`,
                                        data: {}
                                    })
                                }
                                
                                agendaDayId = results.insertId

                            })

                    } else {
                        agendaDayId = results[0].agenda_day_id
                    }

                    connection.query(
                        `INSERT INTO 
                            schedules
                        (battery_id, user_id, agenda_id, status_id, created_at, updated_at)
                        VALUES
                        (${batteryId}, ${userId}, ${agendaDayId}, ${SCHEDULE_STATUS.SCHEDULED}, NOW(), NOW())`,
                        function (err, results, fields) {

                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: "Ocorreu um erro no agendamento!",
                                    verbose: `${err}`,
                                    data: {}
                                })
                            }

                            return res.status(200).json({
                                success: true,
                                message: "Agendado com sucesso!",
                                verbose: null,
                                data: {
                                    schedule_id: results.insertId
                                }
                            })

                        })

                })

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