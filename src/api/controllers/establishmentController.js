const Establishment = require('../models/Establishment')
const EstablishmentAddress = require('../models/EstablishmentAddress')
const mysql = require('../../config/mysql')

const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')
const logger = require('../classes/logger')

const { connection } = require('../../config/database')
const { handleError } = require('../classes/error-handler')
const { ADDRESS, SCHEDULE_STATUS } = require('../classes/constants')

exports.store = async function (req, res) {

    const establishment = {
        name: req.body.name,
        cnpj: req.body.cnpj,
        cpf: req.body.cpf,
        professor: req.body.professor,
        account: req.body.account
    }

    req.assert('name', 'O nome deve ser informado').notEmpty()
    req.assert('cpf', 'O cpf do usuário deve ser informado').notEmpty()
    req.assert('cpf', 'O cpf está em formato inválido').len(11)
    req.assert('professor', 'O nome do professor deve ser informado').notEmpty()
    req.assert('account.email', 'O email deve ser informado').notEmpty()
    req.assert('account.email', 'O email está em formato inválido').isEmail()
    req.assert('account.password', 'A senha deve ser informada').notEmpty()

    if (validator.validateFields(req, res) != null) {
        return
    }

    if (establishment.cnpj === undefined) {
        cnpj = null
    }

    try {

        const hashedPassword = await bcrypt.hash(establishment.account.password, 10)

        establishment.account.password = hashedPassword

        var query = `
            SELECT
                * 
            FROM establishments e 
            INNER JOIN establishment_accounts ec 
                ON ec.establishment_id = e.id
            WHERE 
                e.name = ? OR 
                e.cpf = ? OR 
                ec.email = ?`

        var queryValues = [
            establishment.name,
            establishment.cpf,
            establishment.account.email]


        connection.beginTransaction(function (err) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)

            connection.query(query, queryValues, function (err, results, fields) {

                if (err)
                    return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)

                if (results.length !== 0) {

                    return res.status(400).json({
                        success: true,
                        message: "Este estabelecimento já está cadastrado!",
                        verbose: null,
                        data: {}
                    })

                } else {

                    query = `
                        INSERT INTO establishments 
                            (parent_id, name, cnpj, cpf, professor, created_at, updated_at)
                        VALUES 
                            (null, ?, ?, ?, ?, NOW(), NOW())`

                    queryValues = [
                        establishment.name,
                        establishment.cnpj,
                        establishment.cpf,
                        establishment.professor
                    ]

                    connection.query(query, queryValues, function (err, results, fields) {

                        if (err)
                            return connection.rollback(function () {
                                handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)
                            })

                        query = `
                            INSERT INTO establishment_accounts
                                (establishment_id, email, password, created_at, updated_at)
                            VALUES 
                                (?, ?, ?, NOW(), NOW())`

                        queryValues = [
                            results.insertId,
                            establishment.account.email,
                            establishment.account.password
                        ]

                        const newEstablishmentId = results.insertId

                        connection.query(query, queryValues, function (err, results, fields) {

                            if (err)
                                return connection.rollback(function () {
                                    handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)
                                })

                            connection.commit(function (err) {
                                if (err)
                                    return connection.rollback(function () {
                                        handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)
                                    })
                            })

                            res.setHeader('access-token', jwtHandler.generate(null, newEstablishmentId))
                            res.setHeader('establishment-id', newEstablishmentId)

                            return res.status(200).json({
                                success: true,
                                message: "Estabelecimento cadastrado com sucesso!",
                                verbose: null,
                                data: {}
                            })

                        })

                    })

                }

            })

        })

    } catch (error) {
        return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)
    }

}

exports.login = async function (req, res) {

    let email = req.body.email
    let password = req.body.password

    req.assert('email', 'O email deve ser informado').notEmpty()
    req.assert('email', 'O email está em formato inválido').isEmail()
    req.assert('password', 'A senha deve ser informado').notEmpty()

    if (validator.validateFields(req, res)) {
        return
    }

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

        res.setHeader('user-id', establishment.id)
        res.setHeader('access-token', jwtHandler.generate(null, establishment.id))

        return res.status(200).json({
            success: true,
            message: "Login realizado com sucesso!",
            verbose: null,
            data: {}
        })

    } catch (error) {
        handleError(req, res, 500, "Ocorreu um erro ao realizar o login!", error)
    }

}

exports.storeAddress = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId
    const typeId = req.body.typeId
    const zipcode = req.body.cep
    const country = req.body.country
    const state = req.body.state
    const city = req.body.city
    const neighbourhood = req.body.neighbourhood
    const street = req.body.street
    const number = req.body.number
    const complement = req.body.complement

    req.assert('typeId', 'O tipo de endereço deve ser informado').notEmpty()
    req.assert('cep', 'O CEP deve ser informado').notEmpty()
    req.assert('cep', 'O CEP está inválido').len(8)
    req.assert('country', 'O País deve ser informado').notEmpty()
    req.assert('state', 'O Estado ser informado').notEmpty()
    req.assert('city', 'A Cidade deve ser informado').notEmpty()
    req.assert('neighbourhood', 'O Bairro deve ser informado').notEmpty()
    req.assert('street', 'A Rua deve ser informado').notEmpty()
    req.assert('number', 'O Número deve ser informado').notEmpty()

    if (validator.validateFields(req, res) != null) {
        return
    }

    try {

        let query = `
            SELECT * 
            FROM establishment_addresses
            WHERE 
                establishment_id = ?
                AND type_id = ?
        `

        let queryValues = [
            establishmentId,
            typeId
        ]

        connection.query(query, queryValues, function (err, result, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o endereço!", err)

            if (result.length != 0 && typeId === ADDRESS.PHYSICAL_TYPE) {

                query = `
                    UPDATE 
                        establishment_addresses 
                    SET 
                        zipcode = ?,
                        country = ?,
                        state = ?,
                        city = ?,
                        neighbourhood = ?,
                        street = ?,
                        number = ?,
                        complement = ?
                    WHERE 
                    establishment_id = ?`

                queryValues = [
                    zipcode,
                    country,
                    state,
                    city,
                    neighbourhood,
                    street,
                    number,
                    complement,
                    establishmentId
                ]

                connection.query(query, queryValues, function (err, result, _) {

                    if (err)
                        return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o endereço!", err)

                    return res.status(200).json({
                        success: true,
                        message: "Endereço atualizado com sucesso!",
                        verbose: null,
                        data: {}
                    })

                })

            } else {

                query = `
                    INSERT INTO establishment_addresses
                        (
                            establishment_id,
                            type_id,
                            zipcode,
                            country,
                            state,
                            city,
                            neighbourhood,
                            street,
                            number,
                            complement,
                            created_at,
                            updated_at
                        )
                    VALUES 
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        NOW(),
                        NOW()
                    )   
                `

                queryValues = [
                    establishmentId,
                    typeId,
                    zipcode,
                    country,
                    state,
                    city,
                    neighbourhood,
                    street,
                    number,
                    complement
                ]

                connection.query(query, queryValues, function (err, result, _) {

                    if (err)
                        return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o endereço!", err)

                    return res.status(200).json({
                        success: true,
                        message: "Endereço cadastrado com sucesso!",
                        verbose: null,
                        data: {}
                    })

                })

            }

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o endereço!", err)
    }

}

exports.serviceAddresses = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId

    try {

        const query = `
            SELECT 
                id,
                zipcode,
                country,
                state,
                city,
                neighbourhood,
                street,
                number,
                complement 
            FROM establishment_addresses
            WHERE 
                establishment_id = ?
                AND type_id = ?
        `

        const queryValues = [
            establishmentId,
            ADDRESS.SERVICE_TYPE
        ]

        connection.query(query, queryValues, function (err, result, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o endereço!", err)

            return res.status(200).json({
                success: true,
                message: "Consulta realizada com sucesso!",
                verbose: null,
                data: { addresses: result }
            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter os endereços de atendimento!", err)
    }

}

exports.storeBranch = async function (req, res) { }

exports.storeEmployee = async function (req, res) { }

exports.getAgenda = async function (req, res) {

    const establishmentId = req.params.establishment_id

    try {

        mysql.connect(mysql.uri, connection => {

            const query = `
                SELECT
                DATE_FORMAT(ess.date, "%Y-%m-%d") AS date,
                    es.id AS status_id,
                    es.short_name AS status
                FROM
                    establishments_status ess
                INNER JOIN establishment_status es ON
                    es.id = ess.status_id
                WHERE
                    ess.establishment_id = ? 
                    AND ess.date >= DATE_FORMAT(NOW(), "%Y-%m-%d")
                ORDER BY
                    ess.date`

            connection.query(query, establishmentId, function (err, results, fields) {

                if (err) {

                    logger.register(err, req, _ => {

                        return res.status(500).json({
                            success: false,
                            message: "Ocorreu um erro ao obter a agenda!",
                            verbose: `${err}`,
                            data: {}
                        })
                    })

                }

                return res.status(200).json({
                    success: true,
                    message: "Agenda obtida com sucesso!",
                    verbose: null,
                    data: {
                        agenda: {
                            dates: results
                        }
                    }
                })

            })

            connection.end()

        })

    } catch (error) {

        logger.register(error, req, _ => {

            return res.status(500).json({
                success: false,
                message: "Ocorreu um erro ao obter a agenda!",
                verbose: `${error}`,
                data: {}
            })

        })

    }

}

exports.getBatteries = async function (req, res) {

    const date = req.body.date
    const sportId = req.body.sportId
    const establishmentId = req.params.establishment_id

    req.assert('date', 'A data deve ser informado').notEmpty()
    req.assert('sportId', 'O id do esporte deve ser informado').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        mysql.connect(mysql.uri, connection => {

            const query = `
                SELECT
                    b.id,
                    b.start_hour AS startHour,
                    b.end_hour AS endHour,
                    b.session_value AS price,
                    ABS(COUNT(s.id) - b.people_allowed) AS availableVacancies
                FROM
                    batteries b
                LEFT JOIN schedules s ON
                    s.battery_id = b.id 
                    AND s.date = ?
                    AND s.status_id NOT IN(?)
                INNER JOIN battery_weekdays ew
                    ON ew.battery_id = b.id
                INNER JOIN weekday w
                    ON w.id = ew.weekday_id
                WHERE
                    b.establishment_id = ?
                    AND b.sport_id = ?
                    AND w.day = LOWER(DATE_FORMAT(?, "%W"))
                GROUP BY
                    b.start_hour,
                    b.id`

            const data = [
                date,
                SCHEDULE_STATUS.CANCELED,
                establishmentId,
                sportId,
                date
            ]

            connection.query(query, data, function (err, results, fields) {

                if (err)
                    return handleError(req, res, 500, "Ocorreu um erro ao obter a bateria!", err)

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

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter a bateria!", err)
    }

}

exports.storeBattery = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId
    const sportId = req.body.sportId
    const addressId = req.body.addressId
    const startHour = req.body.startHour
    const finishHour = req.body.finishHour
    const price = req.body.price
    const peopleAmount = req.body.peopleAmount
    const weekdays = req.body.weekdays

    req.assert('sportId', 'O id do esporte deve ser informado').notEmpty()
    req.assert('addressId', 'O id do endereço deve ser informado').notEmpty()
    req.assert('startHour', 'A hora de início deve ser informada').notEmpty()
    req.assert('finishHour', 'A hora de fim deve ser informada').notEmpty()
    req.assert('price', 'O valor deve ser informado').notEmpty()
    req.assert('peopleAmount', 'O quantidade máxima de pessoas deve ser informada').notEmpty()
    req.assert('weekdays', 'Os dias da semana devem ser informados').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        connection.beginTransaction(function (err) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)

            let query = `
                INSERT INTO batteries 
                (
                    establishment_id, 
                    address_id, 
                    sport_id, 
                    start_hour, 
                    end_hour, 
                    session_value, 
                    people_allowed, 
                    created_at, 
                    updated_at
                )
                VALUES
                (
                    ?, 
                    ?, 
                    ?, 
                    ?, 
                    ?, 
                    ?, 
                    ?, 
                    NOW(), 
                    NOW()
                )
            `

            let queryValues = [
                establishmentId,
                addressId,
                sportId,
                startHour,
                finishHour,
                price,
                peopleAmount
            ]

            connection.query(query, queryValues, function (err, results, fields) {

                if (err) {
                    return connection.rollback(function () {
                        handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                    })
                }

                query = `
                    INSERT INTO battery_weekdays
                    (
                        battery_id,
                        weekday_id
                    )
                    VALUES
                    (
                        ?,
                        ?
                    )
                `

                for (index in weekdays) {

                    queryValues = [
                        results.insertId,
                        weekdays[index]
                    ]

                    connection.query(query, queryValues, function (err, result, fields) {

                        if (err) {
                            return connection.rollback(function () {
                                handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                            })
                        }

                        if (index == weekdays.length - 1) {

                            connection.commit(function (err) {

                                if (err) {
                                    return connection.rollback(function () {
                                        handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                                    })
                                }

                                return res.status(200).json({
                                    success: true,
                                    message: "Bateria adicionado com sucesso!",
                                    verbose: null,
                                    data: {}
                                })

                            })

                        }

                    })

                }

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
    }
}