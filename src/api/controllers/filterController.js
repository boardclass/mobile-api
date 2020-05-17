const { handleError } = require('../classes/error-handler')

exports.sports = async function (req, res) {

    try {

        const query = `
            SELECT DISTINCT
                s.id,
                s.display_name AS name
            FROM
                sports s
            INNER JOIN batteries b 
                ON b.sport_id = s.id
            ORDER BY
                name
        `

        req.connection.query(query, function (err, results, fields) {

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

    } catch (error) {
        handleError(req, res, 500, "Ocorreu um erro ao obter os esportes!", error)
    }

}

exports.addresses = async function (req, res) {

    const sportId = req.params.sport_id

    try {

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
                    AND b.deleted = false
                ORDER BY ea.country, ea.state, ea.city, ea.neighbourhood`

        req.connection.query(query, [sportId], function (err, results, fields) {

            if (err) {
                return handleError(req, res, 500, "Ocorreu um erro ao obter o endereço!", err)
            }

            return res.status(200).json({
                success: true,
                message: "Consulta realizada com sucesso!",
                verbose: null,
                data: {
                    addresses: results
                }
            })

        })

    } catch (error) {
        handleError(req, res, 500, "Ocorreu um erro ao obter o endereço!", err)
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

        const query = `
                SELECT DISTINCT
                    e.id, 
                    e.name,
                    ea.id AS addressId,
                    IF(
                        (
                            SELECT 1 
                            FROM establishments_favorites ef 
                            WHERE ef.establishment_id = e.id 
                            AND ef.user_id = ?
                        ), true, false
                    ) AS isFavorite,
                    IF(
                        (
                            SELECT 1
                            FROM users u
                            INNER JOIN establishments_indication ei
                                ON u.indication_id = ei.id 
                            WHERE u.id = ?
                            AND ei.establishment_id = e.id
                        ), true, false
                    ) AS isIndicated
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
                    AND ea.type_id = 2
                ORDER BY 
                    e.name`

        const fiters = [
            sportId,
            address.country,
            address.state,
            address.city,
            address.neighbourhood
        ]

        req.connection.query(query, fiters, function (err, results, _) {

            if (err) {
                handleError(req, res, 500, "Ocorreu um erro ao filtrar o estabelecimento!", err)
            }

            return res.status(200).json({
                success: true,
                message: "Filtro realizado com sucesso!",
                verbose: null,
                data: {
                    establishments: results
                }
            })

        })

    } catch (error) {
        handleError(req, res, 500, "Ocorreu um erro ao filtrar o estabelecimento!", err)
    }

}