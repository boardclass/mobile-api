const Establishment = require('../models/Establishment')
const EstablishmentAddress = require('../models/EstablishmentAddress')
const mysql = require('../../config/mysql')

const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const { ADDRESS, SCHEDULE_STATUS } = require('../classes/constants')

exports.store = async function (req, res) {

    const establishment = req.body

    req.assert('name', 'O nome deve ser informado').notEmpty()
    req.assert('account.email', 'O email deve ser informado').notEmpty()
    req.assert('account.password', 'A senha deve ser informada').notEmpty()

    validator.validateFiels(req, res)

    if (establishment.cnpj === undefined)
        establishment.cnpj = null

    const token = jwtHandler.generate(establishment.account.email)
    res.setHeader('access-token', token)

    try {

        const hashedPassword = await bcrypt.hash(establishment.account.password, 10)

        establishment.account.password = hashedPassword

        const newEstablishment = await Establishment.findOrCreate({
            where: {
                [Op.or]: [
                    { cnpj: establishment.cnpj },
                    { name: establishment.name }
                ]
            },
            defaults: {
                name: establishment.name,
                cnpj: establishment.cnpj,
                account: establishment.account
            },
            include: {
                association: 'account'
            }
        })

        res.set('establishment-id', newEstablishment[0].id)

        return res.status(200).json({
            success: true,
            message: "Estabelecimento cadastrado com sucesso!",
            verbose: null,
            data: {}
        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao cadastrar o estabelecimento!",
            verbose: `${error}`,
            data: {}
        })

    }

}

exports.login = async function (req, res) {

    let email = req.body.email
    let password = req.body.password

    req.assert('email', 'O email deve ser informado')
    req.assert('password', 'A senha deve ser informado')

    validator.validateFiels(req, res)

    const token = jwtHandler.generate(email)

    try {

        const establishment = await Establishment.findOne({
            include: {
                association: 'account',
                where: {
                    email
                }
            }
        })

        if (!establishment) {

            return res.status(404).json({
                success: true,
                message: "Este email não está cadastrado em nossa base!",
                verbose: null,
                data: {}
            })

        }

        const matchPassword = await bcrypt.compare(password, establishment.account.password)

        if (!matchPassword) {

            return res.status(404).json({
                success: true,
                message: "Não foi possível realizar o login, senha incorreta!",
                verbose: null,
                data: {}
            })

        }

        res.setHeader('access-token', token)
        res.setHeader('user-id', establishment.id)

        return res.status(200).json({
            success: true,
            message: "Login realizado com sucesso!",
            verbose: null,
            data: {}
        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao realizar o login!",
            verbose: `${error}`,
            data: {}
        })

    }

}

exports.storeAddress = async function (req, res) {

    let establishment_id = req.params.establishment_id
    let zipcode = req.body.cep
    let country = req.body.country
    let state = req.body.state
    let city = req.body.city
    let neighbourhood = req.body.neighbourhood
    let street = req.body.street
    let number = req.body.number
    let complement = req.body.complement

    req.assert('cep', 'O CEP deve ser informado').notEmpty()
    req.assert('cep', 'O CEP está inválido').len(8)
    req.assert('country', 'O País deve ser informado').notEmpty()
    req.assert('state', 'O Estado ser informado').notEmpty()
    req.assert('city', 'A Cidade deve ser informado').notEmpty()
    req.assert('neighbourhood', 'O Bairro deve ser informado').notEmpty()
    req.assert('street', 'A Rua deve ser informado').notEmpty()
    req.assert('number', 'O Número deve ser informado').notEmpty()

    validator.validateFiels(req, res)

    try {

        await EstablishmentAddress.create({
            zipcode,
            country,
            state,
            city,
            neighbourhood,
            street,
            number,
            complement,
            type_id: ADDRESS.PHYSICAL_ADDRESS_TYPE,
            establishment_id,
        })

        return res.status(200).json({
            success: true,
            message: "Endereço cadastrado com sucesso!",
            verbose: null,
            data: {}
        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao cadastrar o endereço!",
            verbose: `${error}`,
            data: {}
        })

    }

}

exports.storeBranch = async function (req, res) { }

exports.storeEmployee = async function (req, res) { }



exports.filter = async function (req, res) {

    let sportId = req.body.sportId
    let address = req.body.address

    req.assert('address.country', 'O país deve ser informado').notEmpty()
    req.assert('address.state', 'O estado deve ser informado').notEmpty()
    req.assert('address.city', 'A cidade deve ser informado').notEmpty()
    req.assert('address.neighbourhood', 'O bairro deve ser informado').notEmpty()

    try {

        let sportFiltering = `IS NOT NULL`

        if (sportId) {
            sportFiltering = `= ${sportId}`
        }

        mysql.connect(mysql.uri, connection => {

            const query = `SELECT DISTINCT e.id, e.name  \
            FROM establishments e \
            INNER JOIN batteries b \
            ON b.establishment_id = e.id \
            INNER JOIN establishment_addresses ea \
            ON ea.id = b.address_id \
            WHERE b.sport_id ${sportFiltering} \
            AND ea.country = "${address.country}" \
            AND ea.state = "${address.state}" \
            AND ea.city = "${address.city}" \
            AND ea.neighbourhood = "${address.neighbourhood}" `

            connection.query(query, [address.country],
                function (err, results, fields) {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Ocorreu um erro ao filtrar!",
                            verbose: `${err}`,
                            data: {}
                        })
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

            connection.end()

        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao filtrar!",
            verbose: `${error}`,
            data: {}
        })

    }

}

exports.getFilters = function (req, res) {

    try {

        mysql.connect(mysql.uri, connection => {

            var sports = []
            var addresses = []

            connection.query(
                `SELECT DISTINCT s.id, s.display_name AS name \
                FROM batteries b \
                INNER JOIN sports s \
                ON s.id = b.sport_id`,
                function (err, results, fields) {

                    if (err) {
                        throw err
                    }

                    sports = results

                })

            connection.query(
                `SELECT DISTINCT ea.id, ea.country, ea.state, ea.city, ea.neighbourhood \
                FROM establishment_addresses ea \
                INNER JOIN batteries b \
                ON b.address_id = ea.id`,
                function (err, results, fields) {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Ocorreu um erro ao obter os filtros!",
                            verbose: `${err}`,
                            data: {}
                        })
                    }

                    addresses = results

                    return res.status(200).json({
                        success: true,
                        message: "Filtros obtido com sucesso!",
                        verbose: null,
                        data: {
                            sports,
                            addresses
                        }
                    })

                })

            connection.end()

        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao obter os filtros!",
            verbose: `${error}`,
            data: {}
        })

    }

}

exports.getAgenda = async function (req, res) {

    const establishmentId = req.params.establishment_id

    try {

        mysql.connect(mysql.uri, connection => {

            connection.query(
                `SELECT a.id, DATE_FORMAT(ad.date,'%Y-%m-%d') as date, 
                    ags.id AS status_id, ags.display_name AS status 
                FROM agenda_dates ad 
                INNER JOIN agendas a 
                    ON ad.agenda_id = a.id
                    AND a.owner_id = ${establishmentId} 
                INNER JOIN agenda_status ags 
                    ON ad.status_id = ags.id`,
                function (err, results, fields) {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Ocorreu um erro ao obter a agenda!",
                            verbose: `${err}`,
                            data: {}
                        })
                    }

                    return res.status(200).json({
                        success: true,
                        message: "Agenda obtida com sucesso!",
                        verbose: null,
                        data: {
                            agenda: {
                                id: results[0].id,
                                dates: results
                            }
                        }
                    })

                })

            connection.end()

        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao obter a agenda!",
            verbose: `${error}`,
            data: {}
        })

    }

}

exports.getBatteries = async function (req, res) {

    const date = req.body.date
    const sportId = req.body.sportId
    const establishmentId = req.params.establishment_id

    try {

        mysql.connect(mysql.uri, connection => {

            connection.query(
                `SELECT
                    b.id,
                    b.start_hour,
                    b.end_hour,
                    b.session_value AS price,
                    ABS(COUNT(s.id) - b.people_allowed) AS available_vacancies
                FROM
                    batteries b
                INNER JOIN agendas a ON
                    a.owner_id = b.establishment_id
                LEFT JOIN agenda_dates ad ON
                    ad.agenda_id = a.id AND ad.date = '${date}'
                LEFT JOIN schedules s ON
                    s.agenda_id = ad.id
                    AND s.battery_id = b.id
                    AND s.status_id NOT IN (${SCHEDULE_STATUS.CANCELED})
                WHERE
                    a.owner_id = ${establishmentId}
                    AND b.sport_id = ${sportId}
                GROUP BY b.id`,
                function (err, results, fields) {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Ocorreu um erro ao obter a bateria!",
                            verbose: `${err}`,
                            data: {}
                        })
                    }

                    return res.status(200).json({
                        success: true,
                        message: "Bateria obtida com sucesso!",
                        verbose: null,
                        data: {
                            batteries: results
                        }
                    })

                })

            connection.end()
        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao obter a bateria!",
            verbose: `${error}`,
            data: {}
        })

    }

}