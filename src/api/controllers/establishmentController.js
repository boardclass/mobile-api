const Establishment = require('../models/Establishment')
const mysql = require('../../config/mysql')

const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')
const logger = require('../classes/logger')

const { connection } = require('../../config/database')
const { handleError } = require('../classes/error-handler')
const { ADDRESS, SCHEDULE_STATUS, USER_TYPE } = require('../classes/constants')

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


        connection.getConnection(function (err, conn) {

            conn.beginTransaction(function (err) {

                if (err)
                    return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)

                conn.query(query, queryValues, function (err, results, fields) {

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

                        conn.query(query, queryValues, function (err, results, fields) {

                            if (err)
                                return conn.rollback(function () {
                                    conn.release()
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

                            conn.query(query, queryValues, function (err, results, fields) {

                                if (err)
                                    return conn.rollback(function () {
                                        conn.release()
                                        handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)
                                    })

                                conn.commit(function (err) {
                                    if (err) {

                                        return conn.rollback(function () {
                                            conn.release()
                                            handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)
                                        })

                                    } else {
                                        conn.release()
                                    }

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

        res.setHeader('establishment-id', establishment.id)
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
                zipcode AS cep,
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

exports.storeEmployee = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId
    const name = req.body.name
    const cpf = req.body.cpf
    const phone = req.body.phone
    const account = {
        email: req.body.account.email,
        password: req.body.account.password
    }

    req.assert('name', 'O nome deve ser informado').notEmpty()
    req.assert('cpf', 'O CPF deve ser informado').notEmpty()
    req.assert('cpf', 'O CPF está com formato inválido').len(11)
    req.assert('cpf', 'O CPF está deve conter apenas números').isNumeric()
    req.assert('phone', 'O telefone deve ser informado').notEmpty()
    req.assert('phone', 'O telefone está com formato inválido').len(13)
    req.assert('phone', 'O telefone deve conter apenas números').isNumeric()
    req.assert('account.email', 'O email deve ser informado').notEmpty()
    req.assert('account.email', 'O email está em formato inválido').isEmail()
    req.assert('account.password', 'A senha deve ser informada').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        account.password = await bcrypt.hash(account.password, 10)

        let query = `
            SELECT 1
            FROM users u
            INNER JOIN establishment_employees ee 
                ON ee.user_id = u.id
            INNER JOIN user_accounts ua 
                ON ua.user_id = u.id
            INNER JOIN users_roles ur
                ON ur.user_id = u.id
            WHERE 
                ee.establishment_id = ?
                AND (
                    u.cpf = ?
                    OR u.phone = ?
                    OR ua.email = ?
                    OR ur.role_id = ?  
                )
        `

        let queryValues = [
            establishmentId,
            cpf,
            phone,
            account.email,
            USER_TYPE.ASSISTANT
        ]

        connection.getConnection(function (err, conn) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)

            conn.beginTransaction(function (err) {

                if (err) {
                    return conn.rollback(function () {
                        conn.release()
                        handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
                    })
                }

                conn.query(query, queryValues, function (err, result, _) {

                    if (err)
                        return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)

                    if (result.length != 0) {

                        return res.status(400).json({
                            success: true,
                            message: "Os dados inseridos já estão em utilização!",
                            verbose: null,
                            data: {}
                        })

                    } else {

                        query = `
                            INSERT INTO users
                            (
                                cpf,
                                name,
                                phone,
                                created_at,
                                updated_at
                            )
                            VALUES
                            (
                                ?,
                                ?,
                                ?,
                                NOW(),
                                NOW()
                            )
                        `

                        queryValues = [
                            cpf,
                            name,
                            phone
                        ]

                        conn.query(query, queryValues, function (err, result, _) {

                            if (err) {
                                return conn.rollback(function () {
                                    conn.release()
                                    handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
                                })
                            }

                            const insertedUserId = result.insertId

                            query = `
                                INSERT INTO user_accounts
                                (
                                    user_id,
                                    email,
                                    password,
                                    created_at,
                                    updated_at
                                )
                                VALUES
                                (
                                    ?,
                                    ?,
                                    ?,
                                    NOW(),
                                    NOW()
                                )
                            `

                            queryValues = [
                                insertedUserId,
                                account.email,
                                account.password
                            ]

                            conn.query(query, queryValues, function (err, result, _) {

                                if (err) {
                                    return conn.rollback(function () {
                                        conn.release()
                                        handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
                                    })
                                }

                                query = `
                                    INSERT INTO users_roles
                                    (
                                        user_id,
                                        role_id,
                                        created_at,
                                        updated_at
                                    )
                                    VALUES
                                    (
                                        ?,
                                        ?,
                                        NOW(),
                                        NOW()
                                    )
                                `
                                queryValues = [
                                    insertedUserId,
                                    USER_TYPE.ASSISTANT
                                ]

                                conn.query(query, queryValues, function (err, result, _) {

                                    if (err) {
                                        return conn.rollback(function () {
                                            conn.release()
                                            handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
                                        })
                                    }

                                    query = `
                                    INSERT INTO establishment_employees
                                    (
                                        establishment_id,
                                        user_id,
                                        created_at,
                                        updated_at
                                    )
                                    VALUES
                                    (
                                        ?,
                                        ?,
                                        NOW(),
                                        NOW()
                                    )
                                `
                                    queryValues = [
                                        establishmentId,
                                        insertedUserId
                                    ]

                                    conn.query(query, queryValues, function (err, result, _) {

                                        if (err) {
                                            return conn.rollback(function () {
                                                conn.release()
                                                handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
                                            })
                                        }

                                        conn.commit(function (err) {

                                            if (err) {
                                                return conn.rollback(function () {
                                                    conn.release()
                                                    handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                                                })
                                            } else {
                                                conn.release()
                                            }

                                            return res.status(200).json({
                                                success: true,
                                                message: "Cadastro realizado com sucesso!",
                                                verbose: null,
                                                data: {}
                                            })

                                        })

                                    })

                                })

                            })

                        })

                    }

                })

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
    }

}

exports.employees = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId

    try {

        const query = `
            SELECT 
                u.id,
                u.name,
                u.phone,
                ua.email
            FROM users u
            INNER JOIN establishment_employees ee 
                ON ee.user_id = u.id
            INNER JOIN user_accounts ua 
                ON ua.user_id = u.id
            INNER JOIN users_roles ur
                ON ur.user_id = u.id
            WHERE 
                ee.establishment_id = ?
                AND ur.role_id = ?
        `

        const queryValues = [
            establishmentId,
            USER_TYPE.ASSISTANT
        ]

        connection.query(query, queryValues, function (err, result, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)

            return res.status(200).json({
                success: true,
                message: "Dados obtidos com sucesso!",
                verbose: null,
                data: { employees: result }
            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter os professores!", err)
    }

}

exports.getAgenda = async function (req, res) {

    const establishmentId = req.params.establishment_id

    try {

        const query = `
            (
                SELECT
                    DATE_FORMAT(s.date, "%Y-%m-%d") AS date,
                    (SELECT id FROM establishment_status WHERE id = IF(COUNT(s.id) < b.people_allowed, 5, 4)) as status_id,
                    (SELECT name FROM establishment_status WHERE id = IF(COUNT(s.id) < b.people_allowed, 5, 4)) as status,
                    (SELECT short_name FROM establishment_status WHERE id = IF(COUNT(s.id) < b.people_allowed, 5, 4)) as short_status
                FROM
                    schedules s
                INNER JOIN batteries b ON
                    b.id = s.battery_id
                WHERE
                    b.establishment_id = ? 
                    AND s.status_id NOT IN(?)
                GROUP BY s.date
            )
            
            Union 
            
            (
                SELECT
                    DATE_FORMAT(ess.date, "%Y-%m-%d") AS date,
                    es.id AS status_id,
                    es.name AS status,
                    es.short_name AS short_status
                FROM
                    establishments_status ess
                INNER JOIN establishment_status es ON
                    es.id = ess.status_id
                WHERE
                    ess.establishment_id = ?
            )
            
            ORDER BY date
        `

        const queryValues = [
            establishmentId,
            SCHEDULE_STATUS.CANCELED,
            establishmentId
        ]

        connection.query(query, queryValues, function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter a agenda!", err)

            return res.status(200).json({
                success: true,
                message: "Agenda obtida com sucesso!",
                verbose: null,
                data: {
                    agenda: results
                }
            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter a agenda!", err)
    }

}

exports.getAvailableBatteries = async function (req, res) {

    const date = req.body.date
    const sportId = req.body.sportId
    const establishmentId = req.params.establishment_id

    req.assert('date', 'A data deve ser informado').notEmpty()
    req.assert('sportId', 'O id do esporte deve ser informado').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        const query = `
            SELECT
                b.id,
                TIME_FORMAT(b.start_hour, "%H:%i") AS startHour,
                TIME_FORMAT(b.end_hour, "%H:%i") AS endHour,
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
                b.id
        `

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

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter a bateria!", err)
    }

}

exports.getBatteriesByDate = async function (req, res) {

    const date = req.params.date
    const establishmentId = req.decoded.data.establishmentId

    try {

        const query = `
            SELECT
                b.id,
                TIME_FORMAT(b.start_hour, "%H:%i") AS startHour,
                TIME_FORMAT(b.end_hour, "%H:%i") AS endHour,
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
                AND w.day = LOWER(DATE_FORMAT(?, "%W"))
            GROUP BY
                b.start_hour,
                b.id
        `

        const data = [
            date,
            SCHEDULE_STATUS.CANCELED,
            establishmentId,
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

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter a bateria!", err)
    }

}

exports.batteries = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId

    const query = `
        SELECT 
            b.id,
            TIME_FORMAT(b.start_hour, "%H:%i") AS start_hour,
            TIME_FORMAT(b.end_hour, "%H:%i") AS end_hour,
            b.session_value,
            b.address_id,
            ea.zipcode AS cep,
            ea.country,
            ea.state,
            ea.city,
            ea.neighbourhood,
            ea.street,
            ea.number,
            ea.complement,
            b.sport_id,
            s.display_name,
            w.id AS weekday_id,
            w.day
        FROM batteries b
        INNER JOIN sports s 
            ON s.id = b.sport_id
        INNER JOIN establishment_addresses ea
            ON ea.id = b.address_id
        INNER JOIN battery_weekdays bw
            ON bw.battery_id = b.id
        INNER JOIN weekday w 
            ON w.id = bw.weekday_id
        WHERE 
            b.establishment_id = ?
        ORDER BY 
            b.start_hour, 
            weekday_id
    `

    const queryValues = [
        establishmentId
    ]

    try {

        connection.query(query, queryValues, function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter as baterias!", err)

            const batteries = []

            for (row of results) {

                let filtered = batteries.findIndex(value => {
                    return value.id === row.id
                })

                if (filtered >= 0) {

                    batteries[filtered].workingDays.push({
                        id: row.weekday_id,
                        day: row.day
                    })

                } else {

                    batteries.push({
                        id: row.id,
                        startHour: row.start_hour,
                        endHour: row.end_hour,
                        price: row.session_value,
                        address: {
                            id: row.address_id,
                            cep: row.cep,
                            country: row.country,
                            state: row.state,
                            city: row.city,
                            street: row.street,
                            neighbourhood: row.neighbourhood,
                            number: row.number,
                            complement: row.complement
                        },
                        sport: {
                            id: row.sport_id,
                            name: row.display_name
                        },
                        workingDays: [{
                            id: row.weekday_id,
                            day: row.day
                        }]
                    })

                }

            }

            return res.status(200).json({
                success: true,
                message: "Consulta realizada com sucesso!",
                verbose: null,
                data: {
                    batteries: batteries
                }
            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter as baterias!", err)
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

        connection.getConnection(function (err, conn) {

            conn.beginTransaction(function (err) {

                if (err) {
                    return conn.rollback(function () {
                        conn.release()
                        handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                    })
                }

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

                conn.query(query, queryValues, function (err, results, fields) {

                    if (err) {
                        return conn.rollback(function () {
                            conn.release()
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

                        conn.query(query, queryValues, function (err, result, fields) {

                            if (err) {
                                return conn.rollback(function () {
                                    conn.release()
                                    handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                                })
                            }

                            if (index == weekdays.length - 1) {

                                conn.commit(function (err) {

                                    if (err) {
                                        return conn.rollback(function () {
                                            conn.release()
                                            handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                                        })
                                    }

                                    conn.release()

                                })

                            }

                        })

                    }

                    return res.status(200).json({
                        success: true,
                        message: "Bateria adicionado com sucesso!",
                        verbose: null,
                        data: {}
                    })

                })

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
    }
}

exports.storeSituation = async function (req, res) {

    const date = req.body.date
    const statusId = req.body.statusId
    let description = req.body.description
    const establishmentId = req.decoded.data.establishmentId

    req.assert('date', 'A data deve ser informada').notEmpty()
    req.assert('statusId', 'O id do status deve ser informado').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        if (description == undefined) {
            description = null
        }

        let query = `
            SELECT 1
            FROM schedules s
            INNER JOIN batteries b 
                ON b.id = s.battery_id
            WHERE b.establishment_id = ?
            AND s.date = ?
            AND status_id NOT IN (?)
        `

        let queryValues = [
            establishmentId,
            date,
            SCHEDULE_STATUS.CANCELED
        ]

        connection.getConnection(function (err, conn) {

            conn.beginTransaction(function (err) {

                if (err) {
                    return conn.rollback(function () {
                        conn.release()
                        handleError(req, res, 500, "Ocorreu um erro ao adicionar a situação!", err)
                    })
                }

                conn.query(query, queryValues, function (err, result, _) {

                    if (err)
                        return handleError(req, res, 500, "Ocorreu um erro ao registrar a situação!", err)

                    if (result.length != 0) {

                        return res.status(400).json({
                            success: true,
                            message: "Não foi possível registrar a situação, existem agendamentos pendentes na data selecionada!",
                            verbose: null,
                            data: {}
                        })

                    } else {

                        query = `
                            INSERT INTO establishments_status
                            (
                                establishment_id,
                                status_id,
                                date,
                                description
                            )
                            VALUES
                            (
                                ?,
                                ?,
                                ?,
                                ?
                            )
                        `

                        queryValues = [
                            establishmentId,
                            statusId,
                            date,
                            description
                        ]

                        conn.query(query, queryValues, function (err, result, _) {

                            if (err) {
                                return conn.rollback(function () {
                                    conn.release()
                                    handleError(req, res, 500, "Ocorreu um erro ao registrar a situação!", err)
                                })
                            }

                            conn.commit(function (err) {

                                if (err) {
                                    return conn.rollback(function () {
                                        conn.release()
                                        handleError(req, res, 500, "Ocorreu um erro ao registrar a situação!", err)
                                    })
                                }

                                conn.release()

                                return res.status(200).json({
                                    success: true,
                                    message: "Situação registrada com sucesso!",
                                    verbose: null,
                                    data: {}
                                })

                            })

                        })

                    }

                })

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao registrar a situação!", err)
    }

}

exports.editSituation = async function (req, res) {

    const id = req.body.id
    const statusId = req.body.statusId
    let description = req.body.description

    req.assert('id', 'O id do situação deve ser informado').notEmpty()
    req.assert('statusId', 'O id do status deve ser informado').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        if (description == undefined) {
            description = null
        }

        const query = `
            UPDATE 
                establishments_status
            SET 
                status_id = ?,
                description = ?
            WHERE 
                id = ?
        `

        const queryValues = [
            statusId,
            description,
            id
        ]

        connection.getConnection(function (err, conn) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao editar a situação!", err)

            conn.beginTransaction(function (err) {

                if (err) {
                    return conn.rollback(function () {
                        conn.release()
                        handleError(req, res, 500, "Ocorreu um erro ao editar a situação!", err)
                    })
                }

                conn.query(query, queryValues, function (err, result, _) {

                    if (err) {
                        return conn.rollback(function () {
                            conn.release()
                            handleError(req, res, 500, "Ocorreu um erro ao editar a situação!", err)
                        })
                    }

                    conn.commit(function (err) {
                        if (err) {

                            return conn.rollback(function () {
                                conn.release()
                                handleError(req, res, 500, "Ocorreu um erro ao editar a situação!", err)
                            })

                        } else {

                            conn.release()

                            if (result.affectedRows == 0) {

                                return res.status(400).json({
                                    success: true,
                                    message: "Não foi possível editar a situação!",
                                    verbose: null,
                                    data: {}
                                })

                            }

                            return res.status(200).json({
                                success: true,
                                message: "Situação editada com sucesso!",
                                verbose: null,
                                data: {
                                    id,
                                    statusId,
                                    description
                                }
                            })

                        }

                    })

                })

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao editar a situação!", err)
    }

}

exports.situationByDate = async function (req, res) {

    const date = req.params.date
    const establishmentId = req.decoded.data.establishmentId

    try {

        const query = `
            SELECT DISTINCT
                id,
                status_id AS statusId,
                description
            FROM establishments_status
            WHERE 
                establishment_id = ?
                AND date = ?
            ORDER BY id DESC
        `

        const queryValues = [
            establishmentId,
            date
        ]

        connection.getConnection(function (err, conn) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao recuperar a situação!", err)

            conn.query(query, queryValues, function (err, result, _) {

                if (err)
                    return handleError(req, res, 500, "Ocorreu um erro ao recuperar a situação!", err)

                conn.release()

                if (result.length === 0) {

                    return res.status(404).json({
                        success: true,
                        message: "Não há situação cadastrada!",
                        verbose: null,
                        data: result
                    })

                }

                return res.status(200).json({
                    success: true,
                    message: "Situação recuperada com sucesso!",
                    verbose: null,
                    data: result[0]
                })

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao recuperar a situação!", err)
    }

}

exports.getSchedulesByBattery = async function (req, res) {

    const date = req.params.date
    const batteryId = req.params.battery_id

    try {

        const query = `
            SELECT
                s.id,
                u.id AS userId,
                u.name AS user
            FROM schedules s
            INNER JOIN batteries b
                ON b.id = s.battery_id
            INNER JOIN establishments e
                ON e.id = b.establishment_id
            INNER JOIN users u
                ON u.id = s.user_id
            WHERE 
                b.id = ?
                AND s.date = ?
                AND s.status_id NOT IN (?)
            ORDER BY user
        `

        const queryValues = [
            batteryId,
            date,
            SCHEDULE_STATUS.CANCELED
        ]

        connection.getConnection(function (err, conn) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter os agendamentos!", err)

            conn.query(query, queryValues, function (err, results, _) {

                if (err)
                    return handleError(req, res, 500, "Ocorreu um erro ao obter os agendamentos!", err)

                conn.release()

                return res.status(200).json({
                    success: true,
                    message: "Busca realizada com sucesso!",
                    verbose: null,
                    data: {
                        schedules: results
                    }
                })

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter os agendamentos!", err)
    }

}

exports.deleteSchedules = async function (req, res) {

    const schedulesId = req.body.schedulesId

    req.assert('schedulesId', 'Os ids dos agendamentos devem ser informados').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        const query = `
            UPDATE
                schedules
            SET status_id = ?
            WHERE id IN (?)
        `

        const queryValues = [
            SCHEDULE_STATUS.CANCELED,
            schedulesId
        ]

        connection.getConnection(function (err, conn) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter cancelar os agendamentos!", err)

            conn.beginTransaction(function (err) {

                if (err) {
                    return conn.rollback(function () {
                        conn.release()
                        handleError(req, res, 500, "Ocorreu um erro ao obter cancelar os agendamentos!", err)
                    })
                }

                conn.query(query, queryValues, function (err, results, _) {

                    if (err) {
                        return conn.rollback(function () {
                            conn.release()
                            handleError(req, res, 500, "Ocorreu um erro ao obter cancelar os agendamentos!", err)
                        })
                    }

                    conn.commit(function (err) {
                        if (err) {

                            return conn.rollback(function () {
                                conn.release()
                                handleError(req, res, 500, "Ocorreu um erro ao obter cancelar os agendamentos!", err)
                            })

                        } else {
                            conn.release()
                        }

                    })

                    return res.status(200).json({
                        success: true,
                        message: "Os agendamentos foram cancelados com sucesso!",
                        verbose: null,
                        data: {}
                    })

                })

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter cancelar os agendamentos!", err)
    }

}