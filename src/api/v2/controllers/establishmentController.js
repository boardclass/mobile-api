const ejs = require('ejs')
const mysql = require('../../common/util/connection')

const randomstring = require("randomstring")

const mailer = require('../../common/classes/mailer')
const bcrypt = require('bcryptjs')
const validator = require('../../common/classes/validator')
const jwtHandler = require('../../common/classes/jwt')
const pdfGenerator = require('../../common/classes/pdf')

const { handleError } = require('../../common/classes/error-handler')
const { ADDRESS, SCHEDULE_STATUS, USER_TYPE, ESTABLISHMENT_STATUS, SCHEDULE_ACTION } = require('../../common/classes/constants');

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

exports.getAvailableAgenda = async function (req, res) {

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

exports.getAgendaStatus = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId

    try {

        const query = 'CALL establishment_agenda_status(?)'

        const queryValues = [
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
                    agenda: results[0]
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

        const params = [
            date,
            establishmentId,
            sportId,
            address.country,
            address.state,
            address.city,
            address.neighbourhood
        ]

        req.connection.query('CALL batteries_available(?,?,?,?,?,?,?)', params, function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter a bateria!", err)

            const batteries = []

            for (row of results[0]) {

                let filtered = batteries.findIndex(value => {
                    return value.id === row.id
                })

                if (filtered >= 0) {

                    if (row.equipmentId != null) {
                        batteries[filtered].equipments.push({
                            id: row.equipmentId,
                            equipmentBatteryId: row.equipmentBatteryId,
                            name: row.equipmentName,
                            description: row.equipmentDescription,
                            price: row.equipmentPrice
                        })
                    }

                } else {

                    let equipments = null

                    if (row.equipmentId != null) {
                        equipments = [{
                            id: row.equipmentId,
                            equipmentBatteryId: row.equipmentBatteryId,
                            name: row.equipmentName,
                            description: row.equipmentDescription,
                            price: row.equipmentPrice
                        }]
                    }

                    batteries.push({
                        id: row.id,
                        startHour: row.startHour,
                        endHour: row.endHour,
                        price: row.price,
                        availableVacancies: row.availableVacancies,
                        beginnerVacancies: row.beginnerVacancies,
                        advancedVacancies: row.advancedVacancies,
                        equipments: equipments
                    })

                }

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

exports.getBatteriesByDate = async function (req, res) {

    const date = req.params.date
    const establishmentId = req.decoded.data.establishmentId

    try {

        const params = [
            date,
            establishmentId
        ]

        req.connection.query('CALL batteries_by_date(?,?)', params, function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter a bateria!", err)

            const batteries = []

            for (row of results[0]) {
                batteries.push({
                    id: row.id,
                    startHour: row.start_hour,
                    endHour: row.end_hour,
                    price: row.price,
                    availableVacancies: row.availableVacancies,
                    selectedVacancies: row.vacancies,
                    beginnerVacancies: row.beginnerVacancies,
                    advancedVacancies: row.advancedVacancies,
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

    try {

        req.connection.query('CALL batteries(?)', establishmentId, function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter as baterias!", err)

            const batteries = []

            for (row of results[0]) {

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
                        totalVacancies: row.total_vacancies,
                        totalBeginnerVacancies: row.beginner_vacancies,
                        totalAdvancedVacancies: row.advanced_vacancies,
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

    const connection = await mysql.connection()

    const establishmentId = req.decoded.data.establishmentId
    const sportId = req.body.sportId
    const addressId = req.body.addressId
    const startHour = req.body.startHour
    const finishHour = req.body.finishHour
    const price = req.body.price
    const peopleAmount = req.body.peopleAmount
    const beginnerAmount = req.body.beginnerAmount
    const advancedAmount = req.body.advancedAmount
    const weekdays = req.body.weekdays
    const equipments = req.body.equipments

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

        const fetchParams = [
            establishmentId,
            sportId,
            addressId,
            startHour,
            finishHour,
            `${weekdays}`
        ]

        await connection.query('START TRANSACTION');

        const fetchedBattery = await connection.query('CALL batteries_slots_used(?,?,?,?,?,?)', fetchParams)

        if (fetchedBattery[0].length != 0) {
            await connection.query('ROLLBACK')
            return res.status(400).json({
                success: true,
                message: "Não foi possível adicionar a bateria, pois os horários já estão sendo utilizados!",
                verbose: null,
                data: {}
            })
        }

        const insertQuery = `
            INSERT INTO batteries 
            (
                establishment_id, 
                address_id, 
                sport_id, 
                start_hour, 
                end_hour, 
                session_value, 
                people_allowed,
                beginner_allowed,
                advanced_allowed,
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
                NOW(), 
                NOW()
            )
        `

        const insertParams = [
            establishmentId,
            addressId,
            sportId,
            startHour,
            finishHour,
            price,
            peopleAmount,
            beginnerAmount,
            advancedAmount,
        ]

        const insertedBattery = await connection.query(insertQuery, insertParams)
        const insertedBatteryId = insertedBattery.insertId

        const weekendInsertQuery = `
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

            let params = queryValues = [
                insertedBatteryId,
                weekdays[index]
            ]

            await connection.query(weekendInsertQuery, params)

        }

        let equipmentsQuery = `
            INSERT INTO battery_equipments
            (
                equipment_id,
                description,
                price,
                battery_id
            )
            VALUES
            (
                ?,
                ?,
                ?,
                ?
            )   
        `

        for (index in equipments) {

            let params = [
                equipments[index].id,
                equipments[index].description,
                equipments[index].price,
                insertedBatteryId
            ]

            await connection.query(equipmentsQuery, params)

        }

        await connection.query('COMMIT')

        return res.status(200).json({
            success: true,
            message: "Bateria adicionado com sucesso!",
            verbose: null,
            data: {}
        })

    } catch (err) {
        await connection.query('ROLLBACK')
        return handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
    } finally {
        await connection.release()
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
    req.assert('equipments', 'Os equipamentos devem ser informados').notEmpty()

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
                    AND b.holiday_id IS NULL
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
    const date = req.body.date
    const statusId = req.body.statusId
    let description = req.body.description
    const establishmentId = req.decoded.data.establishmentId

    req.assert('id', 'O id do situação deve ser informado').notEmpty()
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
                    handleError(req, res, 500, "Ocorreu um erro ao editar a situação!", err)
                })
            }

            req.connection.query(query, queryValues, function (err, result, _) {

                if (err) {
                    return req.connection.rollback(function () {
                        handleError(req, res, 500, "Ocorreu um erro ao editar a situação!", err)
                    })
                }

                if (result.length != 0) {

                    return res.status(400).json({
                        success: true,
                        message: "Não foi possível editar a situação, existem agendamentos pendentes na data selecionada!",
                        verbose: null,
                        data: {}
                    })

                }

                query = `
                    UPDATE 
                        establishments_status
                    SET 
                        status_id = ?,
                        description = ?
                    WHERE 
                        id = ?
                `

                queryValues = [
                    statusId,
                    description,
                    id
                ]

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

exports.selfSchedule = async function (req, res) {

    const date = req.body.date;
    const user = req.body.user;
    const batteryId = req.body.batteryId;
    const clientLevel = req.body.clientLevel;

    req.assert('date', 'A data deve ser informada').notEmpty();
    req.assert('user.cpf', 'O CPF deve ser informado').notEmpty()
    req.assert('user.cpf', 'O CPF está com formato inválido').len(11)
    req.assert('user.cpf', 'O CPF está deve conter apenas números').isNumeric()
    req.assert('user.name', 'O nome do usuário deve ser informado').notEmpty();
    req.assert('user.phone', 'O telefone deve ser informado').notEmpty();
    req.assert('batteryId', 'O id da bateria deve ser informado').notEmpty();
    req.assert('clientLevel', 'O nível do cliente deve ser informado').notEmpty();

    if (validator.validateFields(req, res) != null)
        return;

    try {

        if (req.decoded.data.establishmentId === undefined) {
            return res.status(401).json({
                success: false,
                message: "Permissão negada, autenticação necessária",
                verbose: null,
                data: {}
            })
        }

        let query = `
            CALL establishment_schedule(?, ?, ?, ?, ?, ?, @callback);
            SELECT @callback AS callback;
        `

        let params = [
            batteryId,
            date,
            user.cpf,
            user.name,
            user.phone,
            clientLevel
        ];

        req.connection.query(query, params, function (err, result, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)

            if (result[1][0] != null) {
                return res.status(500).json({
                    success: false,
                    message: result[1][0].callback,
                    verbose: null,
                    data: null
                })
            }
    
            res.status(200).json({
                success: true,
                message: "Agendamento realizado com sucesso!",
                verbose: null,
                data: null
            })
    
        })

        

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro no agendamento!", err)
    }

}

exports.editSchedule = async function (req, res) {

    const action = req.body.action;
    const scheduleId = req.body.scheduleId;

    req.assert('action', 'A ação do agendamento deve ser informada').notEmpty();
    req.assert('scheduleId', 'O id dos agendamentos devem ser informado').notEmpty();

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
        `;

        let scheduleAction = null

        switch (action) {
            case SCHEDULE_ACTION.CANCEL:
                scheduleAction = SCHEDULE_STATUS.CANCELED
                break;
            case SCHEDULE_ACTION.PAY:
                scheduleAction = SCHEDULE_STATUS.PAID
                break;
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
        ];

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

        const params = [
            establishmentId,
            month,
            year
        ]

        req.connection.query('CALL establishment_extract(?,?,?)', params, function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter extrato!", err)

            const extract = []

            for (row of results[0]) {

                let filtered = extract.findIndex(value => {
                    return value.month === row.month
                        && value.year === row.year
                })

                if (filtered >= 0) {

                    let scheduleFiltered = extract.findIndex(value => {
                        return value.scheduleId == row.scheduleId

                    })

                    if (scheduleFiltered > 0) {

                        extract[filtered].schedules[scheduleFiltered].push({
                            id: row.scheduleId,
                            date: row.date,
                            name: row.name,
                            phone: row.phone,
                            email: row.userEmail,
                            batteryId: row.batteryId,
                            value: row.value,
                            start: row.startHour,
                            end: row.endHour,
                            reservedVacancies: row.reservedVacancies,
                            status: row.status,
                            isDetached: row.isDetached,
                            equipmentsValue: row.equipmentPrice,
                            totalValue: row.totalValue,
                            clientLevel: row.clientLevel
                        })

                    } else {

                        extract[filtered].schedules.push({
                            id: row.scheduleId,
                            date: row.date,
                            name: row.name,
                            phone: row.phone,
                            email: row.userEmail,
                            batteryId: row.batteryId,
                            value: row.value,
                            start: row.startHour,
                            end: row.endHour,
                            reservedVacancies: row.reservedVacancies,
                            status: row.status,
                            isDetached: row.isDetached,
                            equipmentsValue: row.equipmentPrice,
                            totalValue: row.totalValue,
                            clientLevel: row.clientLevel
                        })

                    }

                } else {

                    extract.push({
                        month: row.month,
                        year: row.year,
                        establishment: row.establishment,
                        schedules: [{
                            date: row.date,
                            name: row.name,
                            phone: row.phone,
                            email: row.userEmail,
                            batteryId: row.batteryId,
                            value: row.value,
                            reservedVacancies: row.reservedVacancies,
                            start: row.startHour,
                            end: row.endHour,
                            status: row.status,
                            isDetached: row.isDetached,
                            equipmentsValue: row.equipmentPrice,
                            totalValue: row.totalValue,
                            clientLevel: row.clientLevel
                        }]
                    })

                }

            }

            ejs.renderFile("./public/template/schedules_extract.ejs",
                { extract: extract[0] }, (err, html) => {

                    if (err) {
                        return handleError(req, res, 500, "Ocorreu um erro ao obter extrato!", err)
                    }

                    pdfGenerator.generate(html, (err, buffer) => {

                        if (err)
                            return handleError(req, res, 500, "Ocorreu um erro ao obter extrato!", err)

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

        const params = [
            establishmentId,
            month,
            year
        ]

        req.connection.query('CALL establishment_extract(?,?,?)', params, function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter extrato!", err)

            const extract = []

            for (row of results[0]) {

                let filtered = extract.findIndex(value => {
                    return value.month === row.month
                        && value.year === row.year
                })

                if (filtered >= 0) {

                    let scheduleFiltered = extract.findIndex(value => {
                        return value.scheduleId == row.scheduleId

                    })

                    if (scheduleFiltered > 0) {

                        extract[filtered].schedules[scheduleFiltered].push({
                            id: row.scheduleId,
                            date: row.date,
                            name: row.name,
                            phone: row.phone,
                            email: row.userEmail,
                            batteryId: row.batteryId,
                            value: row.value,
                            start: row.startHour,
                            end: row.endHour,
                            reservedVacancies: row.reservedVacancies,
                            status: row.status,
                            isDetached: row.isDetached,
                            equipmentsValue: row.equipmentPrice,
                            totalValue: row.totalValue,
                            clientLevel: row.clientLevel
                        })

                    } else {

                        extract[filtered].schedules.push({
                            id: row.scheduleId,
                            date: row.date,
                            name: row.name,
                            phone: row.phone,
                            email: row.userEmail,
                            batteryId: row.batteryId,
                            value: row.value,
                            start: row.startHour,
                            end: row.endHour,
                            reservedVacancies: row.reservedVacancies,
                            status: row.status,
                            isDetached: row.isDetached,
                            equipmentsValue: row.equipmentPrice,
                            totalValue: row.totalValue,
                            clientLevel: row.clientLevel
                        })

                    }

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
                            status: row.status,
                            isDetached: row.isDetached,
                            equipmentsValue: row.equipmentPrice,
                            totalValue: row.totalValue,
                            clientLevel: row.clientLevel
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

                    pdfGenerator.generateFile(html, (err, file) => {

                        if (err)
                            return handleError(req, res, 500, "Ocorreu um erro ao enviar extrato!", err)

                        let filename = `extract_${currentExtract.establishment}_${currentExtract.month}_${currentExtract.year}.pdf`

                        const data = {
                            destination: currentExtract.email,
                            subject: `${extract[0].establishment} - Extrato ${extract[0].month}/${extract[0].year}`,
                            message: `Segue extrato de referência ${extract[0].month}/${extract[0].year} no formato pdf`,
                            attachments: [{
                                filename: filename,
                                path: file.filename,
                                contentType: 'application/pdf'
                            }]
                        }

                        mailer.send(data, (error, result) => {

                            if (error)
                                return handleError(req, res, 500, "Ocorreu um erro ao enviar extrato!", error)

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

exports.holidays = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId

    req.connection.query('CALL establishment_holidays(?)', establishmentId, function (err, result, _) {

        if (err)
            return handleError(req, res, 500, "Ocorreu um erro ao obter os feriados!", err)

        return res.status(200).json({
            success: true,
            message: '',
            verbose: null,
            data: result[0]
        })

    })

}

exports.getBatteriesByHoliday = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId
    const holidayId = req.params.holiday_id

    req.connection.query('CALL batteries_holiday(?, ?)', [establishmentId, holidayId], function (err, result, _) {

        if (err)
            return handleError(req, res, 500, "Ocorreu um erro ao obter as baterias do feriado!", err)

        const results = result[0]
        const batteries = []

        for (row of results) {

            batteries.push({
                id: row.id,
                startHour: row.start_hour,
                endHour: row.end_hour,
                price: row.session_value,
                totalVacancies: row.total_vacancies,
                totalBeginnerVacancies: row.beginner_vacancies,
                totalAdvancedVacancies: row.advanced_vacancies,
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
                }
            })

        }

        return res.status(200).json({
            success: true,
            message: '',
            verbose: null,
            data: {
                batteries
            }
        })

    })

}

exports.storeHolidayBattery = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId
    const holidayId = req.body.holidayId
    const sportId = req.body.sportId
    const addressId = req.body.addressId
    const startHour = req.body.startHour
    const finishHour = req.body.finishHour
    const price = req.body.price
    const peopleAmount = req.body.peopleAmount
    const beginnerAmount = req.body.beginnerAmount
    const advancedAmount = req.body.advancedAmount
    const equipments = req.body.equipments

    req.assert('holidayId', 'O id do feriado deve ser informado').notEmpty()
    req.assert('sportId', 'O id do esporte deve ser informado').notEmpty()
    req.assert('addressId', 'O id do endereço deve ser informado').notEmpty()
    req.assert('startHour', 'A hora de início deve ser informada').notEmpty()
    req.assert('finishHour', 'A hora de fim deve ser informada').notEmpty()
    req.assert('price', 'O valor deve ser informado').notEmpty()
    req.assert('peopleAmount', 'O quantidade máxima de pessoas deve ser informada').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    const query = `
        CALL store_holiday_battery(?,?,?,?,?,?,?,?,?,?, @battery_id, @callback); 
        SELECT @battery_id AS batteryId, @callback AS callback;
    `

    const params = [
        holidayId,
        establishmentId,
        sportId,
        addressId,
        startHour,
        finishHour,
        price,
        peopleAmount,
        beginnerAmount,
        advancedAmount
    ]

    req.connection.query(query, params, async function (err, result, _) {

        if (err)
            return handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)

        let callback = result[1][0].callback
        let batteryId = result[1][0].batteryId

        if (callback != null) {
            return res.status(500).json({
                success: false,
                message: callback,
                verbose: null,
                data: null
            })
        }

        for (const equipment of equipments) {

            let params = [
                batteryId,
                equipment.id,
                equipment.description,
                equipment.price
            ]

            req.connection.query('CALL store_battery_equipment(?,?,?,?)', params)
        }

        return res.status(200).json({
            success: true,
            message: "Bateria adicionado com sucesso!",
            verbose: null,
            data: null
        })

    })

}

exports.dropBattery = async function (req, res) {

    const batteryId = req.params.battery_id

    const query = `
        CALL drop_battery(?, @callback); 
        SELECT @callback AS callback;
    `

    req.connection.query(query, batteryId, function (err, result, _) {

        if (err)
            return handleError(req, res, 500, "Ocorreu um erro ao deletar a bateria!", err)

        let callback = result[1][0].callback

        if (callback != undefined)
            return res.status(500).json({
                success: false,
                message: callback,
                verbose: null,
                data: null
            })


        return res.status(200).json({
            success: true,
            message: "Bateria deletada com sucesso!",
            verbose: null,
            data: null
        })

    })

}