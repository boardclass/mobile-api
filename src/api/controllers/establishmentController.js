const ejs = require('ejs')

const Establishment = require('../models/Establishment')
const randomstring = require("randomstring");

const mailer = require('../classes/mailer')
const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')
const pdfGenerator = require('../classes/pdf')

const { handleError } = require('../classes/error-handler')
const { minutesRestriction } = require('../classes/time-restriction')
const { ADDRESS, SCHEDULE_STATUS, USER_TYPE, ESTABLISHMENT_STATUS, SCHEDULE_ACTION } = require('../classes/constants')

exports.store = async function (req, res) {

    let establishment = {
        name: req.body.name,
        cnpj: req.body.cnpj,
        cpf: req.body.cpf,
        professor: req.body.professor,
        phone: req.body.phone,
        account: req.body.account
    }

    req.assert('name', 'O nome deve ser informado').notEmpty()
    req.assert('cpf', 'O cpf do usuário deve ser informado').notEmpty()
    req.assert('cpf', 'O cpf está em formato inválido').len(11)
    req.assert('professor', 'O nome do professor deve ser informado').notEmpty()
    req.assert('phone', 'O telefone do professor deve ser informado').notEmpty()
    req.assert('phone', 'O formato do telefone está inválido, exemplo de formato correto: 5511912345678').len(13)
    req.assert('account.email', 'O email deve ser informado').notEmpty()
    req.assert('account.email', 'O email está em formato inválido').isEmail()
    req.assert('account.password', 'A senha deve ser informada').notEmpty()

    if (validator.validateFields(req, res) != null) {
        return
    }

    if (establishment.cnpj === undefined)
        cnpj = null

    if (establishment.phone === undefined)
        establishment.phone = null

    try {

        const indication = randomstring.generate(6)
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
                e.phone = ? OR
                ec.email = ?
        `

        var queryValues = [
            establishment.name,
            establishment.cpf,
            establishment.phone,
            establishment.account.email
        ]

        req.connection.beginTransaction(function (err) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)

            req.connection.query(query, queryValues, function (err, results, fields) {

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
                                (parent_id, name, cnpj, cpf, professor, phone, created_at, updated_at)
                            VALUES 
                                (null, ?, ?, ?, ?, ?,NOW(), NOW())`

                    queryValues = [
                        establishment.name,
                        establishment.cnpj,
                        establishment.cpf,
                        establishment.professor,
                        establishment.phone
                    ]

                    req.connection.query(query, queryValues, function (err, results, fields) {

                        if (err)
                            return req.connection.rollback(function () {
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

                        req.connection.query(query, queryValues, function (err, results, fields) {

                            if (err)
                                return req.connection.rollback(function () {
                                    handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)
                                })

                            query = `
                                    INSERT INTO establishments_indication 
                                        (establishment_id, code)
                                    VALUES
                                        (?, ?)
                                `

                            queryValues = [
                                newEstablishmentId,
                                indication
                            ]

                            req.connection.query(query, queryValues, function (err, results, fields) {

                                if (err)
                                    return req.connection.rollback(function () {
                                        handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)
                                    })

                                req.connection.commit(function (err) {
                                    if (err) {

                                        return req.connection.rollback(function () {
                                            handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)
                                        })

                                    }

                                })

                                res.setHeader('role-id', USER_TYPE.PROFESSOR)
                                res.setHeader('access-token', jwtHandler.generate(null, newEstablishmentId))
                                res.setHeader('establishment-id', newEstablishmentId)

                                return res.status(200).json({
                                    success: true,
                                    message: "Estabelecimento cadastrado com sucesso!",
                                    verbose: null,
                                    data: {
                                        roleId: USER_TYPE.PROFESSOR,
                                        name: establishment.name,
                                        cnpj: establishment.cnpj,
                                        cpf: establishment.cpf,
                                        phone: establishment.phone,
                                        professor: establishment.professor,
                                        indication: indication
                                    }
                                })

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

    if (validator.validateFields(req, res))
        return

    try {

        const query = `
            SELECT DISTINCT
                e.id,
                e.name,
                e.cnpj,
                e.cpf,
                e.professor,
                e.phone,
                ei.code,
                ea.password
            FROM establishments e
            INNER JOIN establishment_accounts ea
                ON ea.establishment_id = e.id
            LEFT JOIN establishments_indication ei
                ON ei.establishment_id = e.id
                AND ei.deleted = false
            WHERE 
                ea.email = ?
            ORDER BY ei.id DESC
        `

        const params = [
            email
        ]

        req.connection.query(query, params, async function (err, result, _) {

            if (err) {
                return handleError(req, res, 500, "Ocorreu um erro ao realizar o login!", err)
            }

            if (result == 0) {

                return res.status(404).json({
                    success: true,
                    message: "Este email não está cadastrado em nossa base!",
                    verbose: null,
                    data: {}
                })

            } else {

                const establishment = result[0]

                const matchPassword = await bcrypt.compare(password, establishment.password)
                    .catch(err => {
                        return handleError(req, res, 500, "Ocorreu um erro ao realizar o login!", err)
                    })

                if (!matchPassword) {

                    return res.status(404).json({
                        success: true,
                        message: "A senha está incorreta!",
                        verbose: null,
                        data: {}
                    })

                }

                res.setHeader('role-id', USER_TYPE.PROFESSOR)
                res.setHeader('establishment-id', establishment.id)
                res.setHeader('access-token', jwtHandler.generate(null, establishment.id))

                return res.status(200).json({
                    success: true,
                    message: "Login realizado com sucesso!",
                    verbose: null,
                    data: {
                        id: establishment.id,
                        name: establishment.name,
                        cnpj: establishment.cnpj,
                        cpf: establishment.cpf,
                        professor: establishment.professor,
                        phone: establishment.phone,
                        indication: establishment.code
                    }
                })

            }

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

        req.connection.query(query, queryValues, function (err, result, _) {

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

                req.connection.query(query, queryValues, function (err, result, _) {

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

                req.connection.query(query, queryValues, function (err, result, _) {

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

        req.connection.query(query, queryValues, function (err, result, _) {

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

exports.getFilteredAgenda = async function (req, res) {

    const establishmentId = req.params.establishment_id
    const sportId = req.params.sport_id
    const addressId = req.params.address_id

    try {

        const query = `
            (
                SELECT
                    query_table.date,
                    query_table.id AS status_id,
                    query_table.display_name AS status,
                    query_table.short_name AS short_status,
                    NULL AS status_message
                    
                FROM (

                    SELECT
                        schedule_table.date,
                        schedule_table.establishment_id,
                        schedule_table.sport_id,
                        schedule_table.schedules_amount,
                        available_vacancies.total_vacancies,
                        establishment_status_table.id,
                        establishment_status_table.display_name,
                        establishment_status_table.short_name
                    FROM (
                    
                        SELECT
                            DATE_FORMAT(s.date, "%Y-%m-%d") AS date,
                            b.establishment_id,
                            b.sport_id,
                            COUNT(*) AS schedules_amount
                        FROM schedules s
                        INNER JOIN batteries AS b 
                            ON b.id = s.battery_id
                        INNER JOIN battery_weekdays AS bw 
                            ON bw.battery_id = b.id
                        INNER JOIN weekday AS w 
                            ON w.id = bw.weekday_id
                        WHERE
                            b.establishment_id = ?
                            AND b.sport_id = ?
                            AND b.address_id = ?
                            AND s.status_id NOT IN (?)
                            AND b.deleted = false
                            AND w.day = LOWER(DATE_FORMAT(s.date, "%W"))
                        GROUP BY 
                            s.date, 
                            b.establishment_id
                    
                    ) AS schedule_table
                    INNER JOIN 
                    (
                    
                        SELECT
                            b1.establishment_id,
                            b1.sport_id,
                            w1.day,
                            SUM(b1.people_allowed) AS total_vacancies
                        FROM batteries AS b1
                        INNER JOIN battery_weekdays bw1 
                            ON bw1.battery_id = b1.id
                        INNER JOIN weekday w1 
                            ON w1.id = bw1.weekday_id
                        WHERE
                            b1.deleted = FALSE
                            AND b1.establishment_id = ?
                            AND b1.sport_id = ?
                            AND b1.address_id = ?
                        GROUP BY w1.day
                    
                    ) AS available_vacancies
                        ON available_vacancies.day = LOWER(DATE_FORMAT(schedule_table.date, "%W"))
                        
                    INNER JOIN (
                    
                        SELECT
                            id,
                            display_name,
                            short_name
                        FROM establishment_status
                        
                    ) AS establishment_status_table 
                    ON establishment_status_table.id = IF (schedule_table.schedules_amount >= available_vacancies.total_vacancies, ?, ?)

                ) AS query_table

                ORDER BY query_table.date
            )
            
            Union 
            
            (
                SELECT
                  DATE_FORMAT(ess.date, "%Y-%m-%d") AS date,
                    es.id AS status_id,
                    es.display_name AS status,
                    es.short_name AS short_status,
                    ess.description AS status_message
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
            sportId,
            addressId,
            SCHEDULE_STATUS.CANCELED,
            establishmentId,
            sportId,
            addressId,
            ESTABLISHMENT_STATUS.FULL,
            ESTABLISHMENT_STATUS.SCHEDULES,
            establishmentId
        ]

        req.connection.query(query, queryValues, function (err, results, _) {

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

exports.getAgenda = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId

    try {

        const query = `
        (
            SELECT DISTINCT
                DATE_FORMAT(s.date, "%Y-%m-%d") AS date,
                es.id AS status_id,
                es.display_name AS status,
                es.short_name AS short_status,
                NULL AS status_message
            FROM schedules s
            INNER JOIN batteries b 
                ON b.id = s.battery_id
            INNER JOIN establishment_status es 
                ON es.id = ?
            WHERE
                b.establishment_id = ?
                AND b.deleted = false
            GROUP BY s.date
        )
        
        Union 

        (
            SELECT DISTINCT
              DATE_FORMAT(ess.date, "%Y-%m-%d") AS date,
                es.id AS status_id,
                es.display_name AS status,
                es.short_name AS short_status,
                ess.description AS status_message
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
            ESTABLISHMENT_STATUS.SCHEDULES,
            establishmentId,
            establishmentId
        ]

        req.connection.query(query, queryValues, function (err, results, _) {

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
    const address = req.body.address
    const establishmentId = req.params.establishment_id

    req.assert('date', 'A data deve ser informado').notEmpty()
    req.assert('sportId', 'O id do esporte deve ser informado').notEmpty()
    req.assert('address.country', 'O país deve ser informado').notEmpty()
    req.assert('address.state', 'O estado deve ser informado').notEmpty()
    req.assert('address.city', 'A cidade deve ser informado').notEmpty()
    req.assert('address.neighbourhood', 'O bairro deve ser informado').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        const query = `
            SELECT
                b.id,
                TIME_FORMAT(b.start_hour, "%H:%i") AS startHour,
                TIME_FORMAT(b.end_hour, "%H:%i") AS endHour,
                b.session_value AS price,
                IFNULL((
                    SELECT             
                        (b.people_allowed - COUNT(s.id)) 
                    FROM schedules s
                    WHERE 
                        s.battery_id = b.id
                        AND s.date = ?
                        AND s.status_id NOT IN (?)
                    GROUP BY s.battery_id
                    ), b.people_allowed
               ) AS availableVacancies
            FROM
                batteries b
            INNER JOIN battery_weekdays ew
                ON ew.battery_id = b.id
            INNER JOIN weekday w
                ON w.id = ew.weekday_id
            INNER JOIN establishment_addresses ea  
                ON ea.id = b.address_id
                AND ea.type_id = ?
            WHERE
                b.establishment_id = ?
                AND b.deleted = false
                AND b.sport_id = ?
                AND w.day = LOWER(DATE_FORMAT(?, "%W"))
                AND ea.country = ?
                AND ea.state = ?
                AND ea.city = ?
                AND ea.neighbourhood = ?
            GROUP BY
                b.start_hour,
                b.id
        `

        const data = [
            date,
            SCHEDULE_STATUS.CANCELED,
            ADDRESS.SERVICE_TYPE,
            establishmentId,
            sportId,
            date,
            address.country,
            address.state,
            address.city,
            address.neighbourhood
        ]

        req.connection.query(query, data, function (err, results, _) {

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
        // TODO: deploy and verify query and json response
        // obs: left join recover batteires when hasn't schedules??
        const query = `
            SELECT
                b.id,
                TIME_FORMAT(b.start_hour, "%H:%i") AS start_hour,
                TIME_FORMAT(b.end_hour, "%H:%i") AS end_hour,
                b.session_value AS price,
                ABS(COUNT(s.id) - b.people_allowed) AS availableVacancies,
                sp.id AS sport_id,
                sp.display_name AS sport,
                b.address_id,
                ea.zipcode AS cep,
                ea.country,
                ea.state,
                ea.city,
                ea.neighbourhood,
                ea.street,
                ea.number,
                ea.complement
            FROM
                batteries b
            LEFT JOIN schedules s ON
                s.battery_id = b.id 
                AND s.date = ?
                AND s.status_id NOT IN(?)
            INNER JOIN sports sp 
                ON sp.id = b.sport_id
            INNER JOIN establishment_addresses ea
                ON ea.id = b.address_id
            INNER JOIN battery_weekdays ew
                ON ew.battery_id = b.id
            INNER JOIN weekday w
                ON w.id = ew.weekday_id
            WHERE
                b.establishment_id = ?
                AND b.deleted = false
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

        req.connection.query(query, data, function (err, results, fields) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter a bateria!", err)

            const batteries = []
            
            for (row of results) {
                batteries.push({
                    id: row.id,
                    startHour: row.start_hour,
                    endHour: row.end_hour,
                    price: row.price,
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
                        name: row.sport
                    }
                })
            }

            return res.status(200).json({
                success: true,
                message: "Bateria obtida com sucesso!",
                verbose: null,
                data: {
                    batteries: batteries
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
            AND b.deleted = false
        ORDER BY 
            b.start_hour, 
            weekday_id
    `

    const queryValues = [
        establishmentId
    ]

    try {

        req.connection.query(query, queryValues, function (err, results, _) {

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

        let fetchQuery = `
                SELECT *
                FROM batteries b
                INNER JOIN battery_weekdays bw
                    ON bw.battery_id = b.id
                WHERE 
                    b.establishment_id = ?
                    AND b.deleted = false
                    AND b.sport_id = ?
                    AND b.address_id = ?
                    AND (
                        (? >= b.start_hour AND ? < b.end_hour) 
                        OR (? > b.start_hour AND ? <= b.end_hour)
                    )
                    AND bw.weekday_id IN (?)
            `

        let fetchParams = [
            establishmentId,
            sportId,
            addressId,
            startHour,
            startHour,
            finishHour,
            finishHour,
            weekdays
        ]

        req.connection.query(fetchQuery, fetchParams, function (err, result, _) {

            if (err) {
                return req.connection.rollback(function () {
                    handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                })
            }

            if (result.length > 0) {

                return res.status(400).json({
                    success: true,
                    message: "Não foi possível adicionar a bateria, pois os horários já estão sendo utilizados!",
                    verbose: null,
                    data: {}
                })

            }

            req.connection.beginTransaction(function (err) {

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

                req.connection.query(query, queryValues, function (err, results, fields) {

                    if (err) {
                        return req.connection.rollback(function () {
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

                        req.connection.query(query, queryValues, function (err, result, fields) {

                            if (err) {
                                return req.connection.rollback(function () {
                                    handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                                })
                            }

                            if (index == weekdays.length - 1) {

                                req.connection.commit(function (err) {

                                    if (err) {
                                        return req.connection.rollback(function () {
                                            handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                                        })
                                    }

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

exports.editBattery = async function (req, res) {

    if (req.decoded.data.establishmentId === undefined) {
        return res.status(401).json({
            success: true,
            message: "Você não está autorizado para realizar está operação!",
            verbose: null,
            data: {}
        })
    }

    const establishmentId = req.decoded.data.establishmentId
    const batteryId = req.params.battery_id
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

        let fetchQuery = `
                SELECT *
                FROM batteries b
                INNER JOIN battery_weekdays bw
                    ON bw.battery_id = b.id
                WHERE 
                    b.establishment_id = ?
                    AND b.id != ?
                    AND b.deleted = false
                    AND b.sport_id = ?
                    AND b.address_id = ?
                    AND (
                        (? >= b.start_hour AND ? < b.end_hour) 
                        OR (? > b.start_hour AND ? <= b.end_hour)
                    )
                    AND bw.weekday_id IN (?)
            `

        let fetchParams = [
            establishmentId,
            batteryId,
            sportId,
            addressId,
            startHour,
            startHour,
            finishHour,
            finishHour,
            weekdays
        ]

        req.connection.query(fetchQuery, fetchParams, function (err, result, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao editar a bateria!", err)

            if (result.length > 0) {

                return res.status(400).json({
                    success: true,
                    message: "Não foi possível editar, pois os horários já estão sendo utilizados!",
                    verbose: null,
                    data: {}
                })

            }

            req.connection.beginTransaction(function (err) {

                if (err) {
                    return req.connection.rollback(function () {
                        handleError(req, res, 500, "Ocorreu um erro ao editar a bateria!", err)
                    })
                }

                let query = `
                        UPDATE 
                            batteries b
                        SET 
                            deleted = true,
                            updated_at = NOW()
                        WHERE 
                            id = ?
                    `

                let queryValues = [
                    batteryId
                ]

                req.connection.query(query, queryValues, function (err, result, _) {

                    if (err) {
                        return req.connection.rollback(function () {
                            handleError(req, res, 500, "Ocorreu um erro ao editar a bateria!", err)
                        })
                    }


                })

                query = `
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

                queryValues = [
                    establishmentId,
                    addressId,
                    sportId,
                    startHour,
                    finishHour,
                    price,
                    peopleAmount
                ]

                req.connection.query(query, queryValues, function (err, result, _) {

                    if (err) {
                        return req.connection.rollback(function () {
                            handleError(req, res, 500, "Ocorreu um erro ao editar a bateria!", err)
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
                            result.insertId,
                            weekdays[index]
                        ]

                        req.connection.query(query, queryValues, function (err, result, fields) {

                            if (err) {
                                return req.connection.rollback(function () {
                                    handleError(req, res, 500, "Ocorreu um erro ao editar a bateria!", err)
                                })
                            }

                            if (index == weekdays.length - 1) {

                                req.connection.commit(function (err) {

                                    if (err) {
                                        return req.connection.rollback(function () {
                                            handleError(req, res, 500, "Ocorreu um erro ao editar a bateria!", err)
                                        })
                                    }

                                })

                            }

                        })

                    }

                    return res.status(200).json({
                        success: true,
                        message: "Bateria editada com sucesso!",
                        verbose: null,
                        data: {}
                    })

                })

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao editar a situação!", err)
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

        req.connection.beginTransaction(function (err) {

            if (err) {
                return req.connection.rollback(function () {
                    handleError(req, res, 500, "Ocorreu um erro ao adicionar a situação!", err)
                })
            }

            req.connection.query(query, queryValues, function (err, result, _) {

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

                    req.connection.query(query, queryValues, function (err, result, _) {

                        if (err) {
                            return req.connection.rollback(function () {
                                handleError(req, res, 500, "Ocorreu um erro ao registrar a situação!", err)
                            })
                        }

                        req.connection.commit(function (err) {

                            if (err) {
                                return req.connection.rollback(function () {
                                    handleError(req, res, 500, "Ocorreu um erro ao registrar a situação!", err)
                                })
                            }

                            return res.status(200).json({
                                success: true,
                                message: "Situação registrada com sucesso!",
                                verbose: null,
                                data: {
                                    id: result.insertId,
                                    statusId,
                                    description
                                }
                            })

                        })

                    })

                }

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

        req.connection.beginTransaction(function (err) {

            if (err) {
                return req.connection.rollback(function () {
                    handleError(req, res, 500, "Ocorreu um erro ao editar a situação!", err)
                })
            }

            req.connection.query(query, queryValues, function (err, result, _) {

                if (err) {
                    return req.connection.rollback(function () {
                        handleError(req, res, 500, "Ocorreu um erro ao editar a situação!", err)
                    })
                }

                req.connection.commit(function (err) {
                    if (err) {

                        return req.connection.rollback(function () {
                            handleError(req, res, 500, "Ocorreu um erro ao editar a situação!", err)
                        })

                    } else {

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


        req.connection.query(query, queryValues, function (err, result, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao recuperar a situação!", err)

            if (result.length === 0) {

                return res.status(404).json({
                    success: true,
                    message: "Não há situação cadastrada!",
                    verbose: null,
                    data: {}
                })

            }

            return res.status(200).json({
                success: true,
                message: "Situação recuperada com sucesso!",
                verbose: null,
                data: result[0]
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
                u.name AS user,
                s.status_id AS status
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
            ORDER BY s.id, userId
        `

        const queryValues = [
            batteryId,
            date
        ]

        req.connection.query(query, queryValues, function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter os agendamentos!", err)

            return res.status(200).json({
                success: true,
                message: "Busca realizada com sucesso!",
                verbose: null,
                data: {
                    schedules: results
                }
            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter os agendamentos!", err)
    }

}

// TODO: TEST SERVICE
exports.selfSchedule = async function (req, res) {

    const date = req.body.date
    const batteryId = req.body.batteryId
    const user = req.body.user

    if (req.decoded.data.establishmentId === undefined) {
        return res.status(401).json({
            success: false,
            message: "Permissão negada, autenticação necessária",
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

        let queryParams = [
            batteryId,
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
                    batteryId
                ]

                req.connection.query(query, filters, function (err, results, _) {

                    if (err) {
                        return req.connection.rollback(function () {
                            return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                        })
                    }

                    let available_vacancies = results[0].available_vacancies

                    if (available_vacancies != 0)  {

                        let query = `
                            SELECT DISTINCT
                                id 
                            FROM users 
                            WHERE cpf = ?
                        `

                        let filters = [
                            user.cpf
                        ]

                        req.connection.query(query, filters, function (err, results, _) {

                            if (err) {
                                return req.connection.rollback(function () {
                                    return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                                })
                            }
                        
                            if (results[0].id == undefined) {

                                query = `
                                    INSERT INTO users
                                    (
                                        cpf,
                                        name,
                                        phone
                                    )
                                    VALUES
                                    (
                                        ?,
                                        ?,
                                        ?
                                    )
                                `

                                filters = [
                                    user.cpf,
                                    user.name,
                                    user.phone
                                ]

                                req.connection.query(query, filters, function (err, results, _) {

                                    if (err) {
                                        return req.connection.rollback(function () {
                                            return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                                        })
                                    }

                                    query = `
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

                                    filters = [
                                        batteryId,
                                        results.insertId,
                                        SCHEDULE_STATUS.PENDENT_PAYMENT,
                                        date
                                    ]
        
                                    req.connection.query(query, filters, function (err, results, fields) {
        
                                        if (err) {
                                            return req.connection.rollback(function () {
                                                return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                                            })
                                        }
        
                                        req.connection.commit(function (err) {
        
                                            if (err) {
                                                req.connection.rollback(function () {
                                                    return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                                                })
                                            }
            
                                            return res.status(200).json({
                                                success: true,
                                                message: "Agendamento realizado com sucesso!",
                                                verbose: null,
                                                data: {}
                                            })

                                        })

                                    })
        
                                    
                                })
                                
                            } else {

                                query = `
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

                                filters = [
                                    batteryId,
                                    results[0].id,
                                    SCHEDULE_STATUS.PENDENT_PAYMENT,
                                    date
                                ]

                                req.connection.query(query, filters, function (err, results, fields) {

                                    if (err) {
                                        return req.connection.rollback(function () {
                                            return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                                        })
                                    }

                                    req.connection.commit(function (err) {

                                        if (err) {
                                            req.connection.rollback(function () {
                                                return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
                                            })
                                        }
        
                                        return res.status(200).json({
                                            success: true,
                                            message: "Agendamento realizado com sucesso!",
                                            verbose: null,
                                            data: {}
                                        })

                                    })

                                })

                            }

                        })

                    } else {

                        return res.status(404).json({
                            success: false,
                            message: "Não foi possível realizar o agendamento, pois não há vagas disponíveis para essa bateria!",
                            verbose: null,
                            data: {}
                        })

                    }

                })

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
    }

}

exports.editSchedule = async function (req, res) {

    const action = req.body.action
    const scheduleId = req.body.scheduleId

    req.assert('action', 'A ação do agendamento deve ser informada').notEmpty()
    req.assert('scheduleId', 'O id dos agendamentos devem ser informado').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        const query = `
            UPDATE
                schedules
            SET 
                status_id = ?,
                updated_at = NOW()
            WHERE id = ?
        `

        let scheduleAction = null

        switch (action) {
            case SCHEDULE_ACTION.CANCEL:
                scheduleAction = SCHEDULE_STATUS.CANCELED
                break
            case SCHEDULE_ACTION.PAY:
                scheduleAction = SCHEDULE_STATUS.PAID
                break
            case SCHEDULE_ACTION.CHECKIN:
                scheduleAction = SCHEDULE_STATUS.CHECKIN
                break
        }

        if (scheduleAction == null) {
            return res.status(503).json({
                success: false,
                message: "Ocorreu um erro. Tente novamente!",
                verbose: "Essa ação não é válida!",
                data: {}
            })
        }

        const queryValues = [
            scheduleAction,
            scheduleId
        ]

        req.connection.beginTransaction(function (err) {

            if (err) {
                return req.connection.rollback(function () {
                    handleError(req, res, 500, "Ocorreu um erro. Tente novamente!", err)
                })
            }

            req.connection.query(query, queryValues, function (err, result, _) {

                if (err) {
                    return req.connection.rollback(function () {
                        handleError(req, res, 500, "Ocorreu um erro. Tente novamente!", err)
                    })
                }

                req.connection.commit(function (err) {

                    if (err) {

                        return req.connection.rollback(function () {
                            handleError(req, res, 500, "Ocorreu um erro. Tente novamente!", err)
                        })

                    }

                })

                if (result.affectedRows == 0) {

                    return res.status(404).json({
                        success: true,
                        message: "Ocorreu um erro. Tenve novamente!",
                        verbose: "Agendamento não foi encontrado!",
                        data: {}
                    })

                }

                return res.status(200).json({
                    success: true,
                    message: "Ação realizada com sucesso!",
                    verbose: null,
                    data: {}
                })

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro. Tenve novamente!", err)
    }

}

exports.getExtractReference = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId

    if (validator.validateFields(req, res) != null)
        return

    try {

        const query = `
            SELECT DISTINCT
                MONTH(s.date) AS month,
                YEAR(s.date) AS year
            FROM schedules s 
            INNER JOIN batteries b
                ON b.id = s.battery_id
            WHERE 
                b.establishment_id = ?
            ORDER BY 
                year DESC,
                month
        `

        req.connection.query(query, establishmentId, function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter o extrato!", err)

            return res.status(200).json({
                success: true,
                message: "Extrato obtido com sucesso!",
                verbose: null,
                data: results
            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter extrato!", err)
    }

}

exports.getExtractByDate = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId
    const month = req.params.month
    const year = req.params.year

    req.assert('month', 'O mês desejado deve ser informado').notEmpty()
    req.assert('year', 'O ano desejado deve ser informado').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        const query = `
            SELECT
                u.id,
                u.name,
                CONCAT('(', SUBSTR(u.phone, 1, 2), ') ', SUBSTR(u.phone, 3, 2), ' ', SUBSTR(u.phone, 5, 5), '-', SUBSTR(u.phone, 10, 4)) AS phone,
                us.email,
                e.name AS establishment,
                DATE_FORMAT(s.date, "%Y-%m-%d") AS date,
                b.id AS batteryId,
                FORMAT(SUM(b.session_value),2) AS value,
                MONTH(s.date) AS month,
                YEAR(s.date) AS year,
                COUNT(b.id) AS reservedVacancies,
                ss.display_name AS status,
                SUBSTRING(b.start_hour, 1, 5) AS startHour,
                SUBSTRING(b.end_hour, 1, 5) AS endHour
            FROM schedules s 
            INNER JOIN users u 
                ON u.id = s.user_id 
            INNER JOIN user_accounts us 
                ON us.user_id = u.id
            INNER JOIN batteries b
                ON b.id = s.battery_id
            INNER JOIN establishments e
                ON e.id = b.establishment_id
            INNER JOIN schedule_status ss
                ON s.status_id = ss.id
            WHERE 
                b.establishment_id = ?
                AND MONTH(s.date) = ?
                AND YEAR(s.date) = ?
            GROUP BY b.id, u.id, s.date
            ORDER BY 
                s.date, 
                u.name, 
                b.start_hour;
        `

        const params = [
            establishmentId,
            month,
            year
        ]

        req.connection.query(query, params, function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter extrato!", err)

            const extract = []

            for (row of results) {

                let filtered = extract.findIndex(value => {
                    return value.month === row.month
                        && value.year === row.year
                })

                if (filtered >= 0) {

                    extract[filtered].schedules.push({
                        date: row.date,
                        name: row.name,
                        phone: row.phone,
                        email: row.email,
                        batteryId: row.batteryId,
                        value: row.value,
                        start: row.startHour,
                        end: row.endHour,
                        reservedVacancies: row.reservedVacancies,
                        status: row.status
                    })

                } else {

                    extract.push({
                        month: row.month,
                        year: row.year,
                        establishment: row.establishment,
                        schedules: [{
                            date: row.date,
                            name: row.name,
                            phone: row.phone,
                            email: row.email,
                            batteryId: row.batteryId,
                            value: row.value,
                            reservedVacancies: row.reservedVacancies,
                            start: row.startHour,
                            end: row.endHour,
                            status: row.status
                        }]
                    })

                }

            }

            ejs.renderFile("./public/template/schedules_extract.ejs",
                { extract: extract[0] }, (err, html) => {

                    if (err) {
                        return handleError(req, res, 500, "Ocorreu um erro ao obter extrato!", err)
                    }

                    pdfGenerator.generate(html, (buffer) => {
                        let base64data = buffer.toString('base64');

                        return res.status(200).json({
                            success: true,
                            message: "Extrato obtido com sucesso!",
                            verbose: null,
                            data: {
                                month: extract[0].month,
                                year: extract[0].year,
                                pdf: base64data
                            }
                        })

                    })

                })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter extrato!", err)
    }

}

exports.shareExtract = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId
    const month = req.params.month
    const year = req.params.year

    req.assert('month', 'O mês desejado deve ser informado').notEmpty()
    req.assert('year', 'O ano desejado deve ser informado').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        const query = `
            SELECT
                u.id,
                u.name,
                CONCAT('(', SUBSTR(u.phone, 1, 2), ') ', SUBSTR(u.phone, 3, 2), ' ', SUBSTR(u.phone, 5, 5), '-', SUBSTR(u.phone, 10, 4)) AS phone,
                e.name AS establishment,
                ua.email AS userEmail,
                ec.email AS establishmentEmail,
                DATE_FORMAT(s.date, "%Y-%m-%d") AS date,
                b.id AS batteryId,
                FORMAT(SUM(b.session_value),2) AS value,
                MONTH(s.date) AS month,
                YEAR(s.date) AS year,
                COUNT(b.id) AS reservedVacancies,
                ss.display_name AS status,
                SUBSTRING(b.start_hour, 1, 5) AS startHour,
                SUBSTRING(b.end_hour, 1, 5) AS endHour
            FROM schedules s 
            INNER JOIN users u 
                ON u.id = s.user_id
            INNER JOIN user_accounts ua
                ON ua.user_id = u.id
            INNER JOIN batteries b
                ON b.id = s.battery_id
            INNER JOIN establishments e
                ON e.id = b.establishment_id
            INNER JOIN establishment_accounts ec
                ON ec.establishment_id = e.id
            INNER JOIN schedule_status ss
                ON s.status_id = ss.id
            WHERE 
                b.establishment_id = ?
                AND MONTH(s.date) = ?
                AND YEAR(s.date) = ?
            GROUP BY b.id, u.id, s.date
            ORDER BY 
                s.date, 
                u.name, 
                b.start_hour;
        `

        const params = [
            establishmentId,
            month,
            year
        ]

        req.connection.query(query, params, function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter extrato!", err)

            const extract = []

            for (row of results) {

                let filtered = extract.findIndex(value => {
                    return value.month === row.month
                        && value.year === row.year
                })

                if (filtered >= 0) {

                    extract[filtered].schedules.push({
                        date: row.date,
                        name: row.name,
                        phone: row.phone,
                        email: row.userEmail,
                        batteryId: row.batteryId,
                        value: row.value,
                        start: row.startHour,
                        end: row.endHour,
                        reservedVacancies: row.reservedVacancies,
                        status: row.status
                    })

                } else {

                    extract.push({
                        month: row.month,
                        year: row.year,
                        establishment: row.establishment,
                        email: row.establishmentEmail,
                        schedules: [{
                            date: row.date,
                            name: row.name,
                            phone: row.phone,
                            email: row.userEmail,
                            batteryId: row.batteryId,
                            value: row.value,
                            start: row.startHour,
                            end: row.endHour,
                            reservedVacancies: row.reservedVacancies,
                            status: row.status
                        }]
                    })

                }

            }

            let currentExtract = extract[0]

            if (currentExtract == null) {
                return res.status(404).json({
                    success: true,
                    message: "Não há extrato disponível",
                    verbose: null,
                    data: null
                })
            }

            ejs.renderFile("./public/template/schedules_extract.ejs",
                { extract: currentExtract }, (err, html) => {

                    if (err)
                        return handleError(req, res, 500, "Ocorreu um erro ao enviar extrato!", err)

                    pdfGenerator.generate(html, (buffer) => {

                        let filename = `extract_${currentExtract.establishment}_${currentExtract.month}_${currentExtract.year}.pdf`

                        let attachments = [{
                            filename: filename,
                            content: buffer,
                            contentType: 'application/pdf'
                        }]

                        const data = {
                            destination: currentExtract.email,
                            subject: `${extract[0].establishment} - Extrato ${extract[0].month}/${extract[0].year}`,
                            message: `Segue extrato de referência ${extract[0].month}/${extract[0].year} no formato pdf`,
                            attachments: attachments
                        }

                        mailer.send(data, (result) => {

                            if (result == undefined)
                                return handleError(req, res, 500, "Ocorreu um erro ao enviar extrato!", null)

                            return res.status(200).json({
                                success: true,
                                message: `O extrato foi enviado para o email: ${currentExtract.email}`,
                                verbose: null,
                                data: null
                            })

                        })

                    })

                })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao enviar extrato!", err)
    }

}