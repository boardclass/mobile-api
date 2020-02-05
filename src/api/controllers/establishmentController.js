const Establishment = require('../models/Establishment')
const EstablishmentAddress = require('../models/EstablishmentAddress')
const mysql = require('../../config/mysql')

const { handleError } = require('../classes/error-handler')
const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')
const logger = require('../classes/logger')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const { ADDRESS, SCHEDULE_STATUS } = require('../classes/constants')

const { connection } = require('../../config/database')

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
    req.assert('account.email', 'O email está em formato inválid').isEmail()
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

                            res.setHeader('access-token', jwtHandler.generate(newEstablishmentId))
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

    req.assert('email', 'O email deve ser informado')
    req.assert('password', 'A senha deve ser informado')

    if (validator.validateFields(req, res) != null) {
        return
    }

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

        logger.register(error, req, _ => {

            return res.status(500).json({
                success: false,
                message: "Ocorreu um erro ao realizar o login!",
                verbose: `${error}`,
                data: {}
            })

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

    if (validator.validateFields(req, res) != null) {
        return
    }

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

        logger.register(error, req, _ => {

            return res.status(500).json({
                success: false,
                message: "Ocorreu um erro ao cadastrar o endereço!",
                verbose: `${error}`,
                data: {}
            })

        })

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

                    logger.register(error, req, _ => {

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
                WHERE
                    b.establishment_id = ?
                    AND b.sport_id = ?
                GROUP BY
                    b.start_hour,
                    b.id`

            const data = [
                date,
                SCHEDULE_STATUS.CANCELED,
                establishmentId,
                sportId
            ]

            connection.query(query, data, function (err, results, fields) {

                if (err) {

                    logger.register(error, req, _ => {

                        return res.status(500).json({
                            success: false,
                            message: "Ocorreu um erro ao obter a bateria!",
                            verbose: `${err}`,
                            data: {}
                        })

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

        logger.register(error, req, _ => {

            return res.status(500).json({
                success: false,
                message: "Ocorreu um erro ao obter a bateria!",
                verbose: `${error}`,
                data: {}
            })

        })

    }

}