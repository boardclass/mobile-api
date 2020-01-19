const mysql = require('../../config/mysql')

exports.sports = async function (req, res) {

    try {

        mysql.connect(mysql.uri, connection => {

            const query = `
                SELECT 
                    id, display_name AS name
                FROM sports
                ORDER BY name`

            connection.query(query, function (err, results, fields) {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Ocorreu um erro ao obter os esportes!",
                        verbose: `${err}`,
                        data: {}
                    })
                }

                return res.status(200).json({
                    success: true,
                    message: "Consulta realizada com sucesso!",
                    verbose: null,
                    data: {
                        sports: results
                    }
                })

            })

            connection.end()

        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao obter os esportes!",
            verbose: `${error}`,
            data: {}
        })

    }

}

exports.addresses = async function (req, res) {

    const sportId = req.params.sport_id

    try {

        mysql.connect(mysql.uri, connection => {

            const query = `
                SELECT DISTINCT
                    ea.country,
                    ea.state,
                    ea.city,
                    ea.neighbourhood
                FROM
                    batteries b
                INNER JOIN establishment_addresses ea ON
                    ea.id = b.address_id
                WHERE
                    b.sport_id = ?
                ORDER BY ea.country, ea.state, ea.city, ea.neighbourhood`

            connection.query(query, [sportId], function (err, results, fields) {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Ocorreu um erro ao obter o endereço!",
                        verbose: `${err}`,
                        data: {}
                    })
                }

                return res.status(200).json({
                    success: true,
                    message: "Consulta realizada com sucesso!",
                    verbose: null,
                    data: {
                        adresses: results
                    }
                })

            })

            connection.end()

        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao obter o endereço!",
            verbose: `${error}`,
            data: {}
        })

    }

}

exports.establishments = async function (req, res) {

    const sportId = req.body.sportId
    const address = req.body.address

    req.assert('sportId', 'O id do esporte deve ser informado').notEmpty()
    req.assert('address.country', 'O país deve ser informado').notEmpty()
    req.assert('address.state', 'O estado deve ser informado').notEmpty()
    req.assert('address.city', 'A cidade deve ser informado').notEmpty()
    req.assert('address.neighbourhood', 'O bairro deve ser informado').notEmpty()

    try {

        mysql.connect(mysql.uri, connection => {

            const query = `
                SELECT DISTINCT
                    e.id, 
                    e.name
                FROM
                    establishments e
                INNER JOIN batteries b ON
                    b.establishment_id = e.id
                INNER JOIN establishment_addresses ea ON
                    ea.id = b.address_id
                WHERE 
                    b.sport_id = ?
                    AND ea.country = ?
                    AND ea.state = ?
                    AND ea.city =  ?
                    AND ea.neighbourhood = ?
                ORDER BY 
                    e.name`

                    const fiters = [
                        sportId,
                        address.country,
                        address.state,
                        address.city,
                        address.neighbourhood
                    ]

            connection.query(query, fiters, function (err, results, fields) {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Ocorreu um erro ao filtrar o estabelecimento!",
                        verbose: `${err}`,
                        data: {}
                    })
                }

                return res.status(200).json({
                    success: true,
                    message: "Filtro realizado com sucesso!",
                    verbose: null,
                    data: {
                        adresses: results
                    }
                })

            })

            connection.end()

        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao filtrar o estabelecimento!",
            verbose: `${error}`,
            data: {}
        })

    }

}