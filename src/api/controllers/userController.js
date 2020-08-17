const UserAddress = require('../models/UserAddress')
const UsersRoles = require('../models/UsersRoles')

const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')
const logger = require('../classes/logger')

const { handleError } = require('../classes/error-handler')
const { SCHEDULE_STATUS, USER_TYPE } = require('../classes/constants')

exports.login = async function (req, res) {

    let email = req.body.email
    let password = req.body.password

    req.assert('email', 'O email deve ser informado')
    req.assert('password', 'A senha deve ser informado')

    if (validator.validateFields(req, res) != null) {
        return
    }

    try {

        let query = `
            SELECT 
                u.id,
                u.cpf,
                u.name,
                u.phone,
                uc.password,
                ur.role_id
            FROM users u
            INNER JOIN user_accounts uc
                ON uc.user_id = u.id
            INNER JOIN users_roles ur
                ON ur.user_id = u.id
                AND ur.role_id = ?
            WHERE 
                uc.email = ?
        `

        let params = [
            USER_TYPE.USER,
            email
        ]

        req.connection.query(query, params, async function (err, result, _) {

            if (err) {
                return handleError(req, res, 500, "Ocorreu um erro ao realizar o login!")
            }

            if (result == 0) {

                return res.status(404).json({
                    success: true,
                    message: "Este email não está cadastrado em nossa base de clientes!",
                    verbose: null,
                    data: {}
                })

            } else {

                const user = result[0]
                const matchPassword = await bcrypt.compare(password, user.password)

                if (!matchPassword) {

                    return res.status(404).json({
                        success: true,
                        message: "A senha está incorreta!",
                        verbose: null,
                        data: {}
                    })

                }

                const token = jwtHandler.generate(user.id, null)

                res.setHeader('role-id', USER_TYPE.USER)
                res.setHeader('access-token', token)

                return res.status(200).json({
                    success: true,
                    message: "Login realizado com sucesso!",
                    verbose: null,
                    data: {
                        id: user.id,
                        cpf: user.cpf,
                        name: user.name,
                        phone: user.phone
                    }
                })

            }

        })

    } catch (error) {
        handleError(req, res, 500, "Ocorreu um erro ao realizar o login!", error)
    }

}

exports.store = async function (req, res) {

    const user = req.body
    const account = req.body.account
    let indicationId = null

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

    if (validator.validateFields(req, res) != null) {
        return
    }

    if (user.indication === undefined) {
        user.indication = null
    }

    try {

        account.password = await bcrypt.hash(account.password, 10)

        const indicationQuery = `
            SELECT id
            FROM establishments_indication
            WHERE code = ?
        `

        if (user.indication != undefined) {

            req.connection.query(indicationQuery, user.indication, function (err, result, _) {

                if (err)
                    return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o usuário!", err)

                if (result.length == 0) {

                    return res.status(404).json({
                        success: true,
                        message: "Código de indicação inválido!",
                        verbose: null,
                        data: {}
                    })

                }

                indicationId = result[0].id

            })

        }

        req.connection.beginTransaction(function (err) {

            if (err) {
                return req.connection.rollback(function () {
                    handleError(req, res, 500, "Ocorreu um erro ao cadastrar o usuário!", err)
                })
            }

            let userQuery = `
                SELECT
                    u.id,
                    ur.role_id AS roleId
                FROM users u
                INNER JOIN user_accounts ua
                    ON ua.user_id = u.id
                INNER JOIN users_roles ur 
                    ON ur.user_id = u.id
                WHERE 
                    ua.email = ? 
                    OR u.phone = ?
                    OR u.cpf = ?
                ORDER BY ur.role_id
            `

            let userParams = [
                account.email,
                user.phone,
                user.cpf
            ]

            req.connection.query(userQuery, userParams, function (err, result, _) {

                if (err) {
                    return req.connection.rollback(function () {
                        handleError(req, res, 500, "Ocorreu um erro ao cadastrar o usuário!", err)
                    })
                }

                if (result.length == 0) {

                    userQuery = `
                        INSERT INTO users
                            (cpf, name, phone, indication_id)
                        VALUES
                            (?, ?, ?, ?)
                    `

                    userParams = [
                        user.cpf,
                        user.name,
                        user.phone,
                        indicationId
                    ]

                    req.connection.query(userQuery, userParams, function (err, result, _) {

                        if (err) {
                            return req.connection.rollback(function () {
                                handleError(req, res, 500, "Ocorreu um erro ao cadastrar o usuário!", err)
                            })
                        }

                        const insertId = result.insertId

                        const accountQuery = `
                            INSERT INTO user_accounts
                                (user_id, email, password)
                            VALUES
                                (?, ?, ?)
                        `
                        const accountParams = [
                            insertId,
                            account.email,
                            account.password
                        ]

                        req.connection.query(accountQuery, accountParams, function (err, result, _) {

                            if (err) {
                                return req.connection.rollback(function () {
                                    handleError(req, res, 500, "Ocorreu um erro ao cadastrar o usuário!", err)
                                })
                            }

                            userQuery = `
                                INSERT INTO users_roles
                                    (user_id, role_id)
                                VALUES
                                    (?, ?)
                            `

                            userParams = [
                                insertId,
                                USER_TYPE.USER
                            ]

                            req.connection.query(userQuery, userParams, function (err, result, _) {

                                if (err) {
                                    return req.connection.rollback(function () {
                                        handleError(req, res, 500, "Ocorreu um erro ao cadastrar o usuário!", err)
                                    })
                                }

                                req.connection.commit(function (err) {

                                    if (err) {

                                        return req.connection.rollback(function () {
                                            handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)
                                        })

                                    } else {

                                        const token = jwtHandler.generate(insertId, null)

                                        res.setHeader('role-id', USER_TYPE.USER)
                                        res.setHeader('user-id', insertId)
                                        res.setHeader('access-token', token)

                                        return res.status(200).json({
                                            success: true,
                                            message: "Usuário cadastrado com sucesso!",
                                            verbose: null,
                                            data: {
                                                roleId: USER_TYPE.USER,
                                                id: insertId,
                                                cpf: user.cpf,
                                                name: user.name,
                                                phone: user.phone,
                                                indication: user.indication
                                            }
                                        })

                                    }

                                })

                            })

                        })

                    })

                } else if (result[0].roleId === USER_TYPE.USER) {

                    return res.status(400).json({
                        success: true,
                        message: "Os dados inseridos já estão sendo utilizados!",
                        verbose: null,
                        data: {}
                    })

                } else if (result[0].roleId === USER_TYPE.ASSISTANT) {

                    const userId = result[0].id

                    userQuery = `
                        INSERT INTO users_roles
                            (user_id, role_id)
                        VALUES
                            (?, ?)
                    `

                    userParams = [
                        userId,
                        USER_TYPE.USER
                    ]

                    req.connection.query(userQuery, userParams, function (err, result, _) {

                        if (err) {
                            return req.connection.rollback(function () {
                                handleError(req, res, 500, "Ocorreu um erro ao cadastrar o usuário!", err)
                            })
                        }

                        req.connection.commit(function (err) {

                            if (err) {

                                return req.connection.rollback(function () {
                                    handleError(req, res, 500, "Ocorreu um erro ao cadastrar o estabelecimento!", err)
                                })

                            } else {

                                const token = jwtHandler.generate(userId, null)

                                res.setHeader('role-id', USER_TYPE.USER)
                                res.setHeader('user-id', userId)
                                res.setHeader('access-token', token)

                                return res.status(200).json({
                                    success: true,
                                    message: "Usuário cadastrado com sucesso!",
                                    verbose: null,
                                    data: {
                                        roleId: USER_TYPE.USER,
                                        id: userId,
                                        cpf: user.cpf,
                                        name: user.name,
                                        phone: user.phone,
                                        indication: user.indication
                                    }
                                })

                            }

                        })

                    })

                }

            })

        })

    } catch (err) {
        handleError(req, res, 500, "Ocorreu um erro ao cadastrar o usuário!", err)
    }

}

exports.storeAddress = async function (req, res) {

    let user_id = req.params.user_id
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

        await UserAddress.findOne({ where: { user_id } })
            .then(function (obj) {

                if (obj) {

                    UserAddress.update({
                        zipcode,
                        country,
                        state,
                        city,
                        neighbourhood,
                        street,
                        number,
                        complement
                    }, { where: { 'user_id': user_id } })

                } else {

                    UserAddress.create({
                        zipcode,
                        country,
                        state,
                        city,
                        neighbourhood,
                        street,
                        number,
                        complement,
                        user_id,
                    })

                }

                return res.status(200).json({
                    success: true,
                    message: "Endereço cadastrado com sucesso!",
                    verbose: null,
                    data: {}
                })

            })

    } catch (error) {
        handleError(req, res, 500, "Ocorreu um erro ao cadastrar o endereço!", error)
    }

}

exports.storeRole = async function (req, res) {

    const user_id = req.params.user_id
    const role_id = req.body.role_id

    req.assert('role_id', 'A permissão deve ser informada!').notEmpty()

    try {

        if (validator.validateFields(req, res) != null) {
            return
        }

        await UsersRoles.create({
            user_id: user_id,
            role_id: role_id
        })

        return res.status(200).json({
            success: true,
            message: "Cadastrado realizado com sucesso!",
            verbose: null,
            data: {}
        })

    } catch (error) {
        handleError(req, res, 500, "Ocorreu um erro ao cadastrar esse usuário!", error)
    }

}

exports.agenda = async function (req, res) {

    const userId = req.decoded.data.userId

    try {

        const query = `
                SELECT 
                    s.id, 
                    DATE_FORMAT(s.date,'%Y-%m-%d') as date, 
                    sp.id AS sport_id, 
                    sp.display_name AS sport, 
                    e.id AS establishment_id, 
                    e.name AS establishment,
                    b.id AS battery_id,
                    COUNT(b.id) AS booking,
                    TIME_FORMAT(b.start_hour, "%H:%i") AS start_hour,
                    TIME_FORMAT(b.end_hour, "%H:%i") AS end_hour,
                    SUM(b.session_value) AS price,
                    ea.zipcode,
                    ea.country,
                    ea.state,
                    ea.city,
                    ea.neighbourhood,
                    ea.street,
                    ea.number,
                    ea.complement,
                    eq.id AS equipment_id,
                    be.id AS equipment_battery_id,
                    eq.name AS equipment_name,
                    be.description AS equipment_description,
                    be.price AS equipment_price
                FROM schedules s
                INNER JOIN batteries b
                    ON b.id = s.battery_id
                INNER JOIN establishments e
                    ON e.id = b.establishment_id
                INNER JOIN sports sp
                    ON sp.id = b.sport_id
                INNER JOIN establishment_addresses ea
                    ON ea.id = b.address_id
                LEFT JOIN schedule_equipments se ON
                    se.schedule_id = s.id 
                LEFT JOIN battery_equipments be 
                    ON be.id = se.equipment_id
                LEFT JOIN equipment eq ON
                    eq.id = be.equipment_id
                WHERE 
                    s.user_id = ?
                    AND s.status_id NOT IN (?)
                GROUP BY b.id, date
                ORDER BY date, sport, establishment, start_hour
                `

        const filters = [
            userId,
            SCHEDULE_STATUS.CANCELED
        ]

        req.connection.query(query, filters,
            function (err, results, fields) {

                if (err) {

                    logger.register(err, req, _ => {
                        return res.status(500).json({
                            success: false,
                            message: "Ocorreu um erro no agendamento!",
                            verbose: `${err}`,
                            data: {}
                        })

                    })

                }

                const agenda = []

                for (row of results) {

                    let filtered = agenda.findIndex(value => {
                        return value.date === row.date
                            && value.establishment.id === row.establishment_id
                    })

                    if (filtered >= 0) {

                        agenda[filtered].batteries.push({
                            id: row.battery_id,
                            booking: row.booking,
                            startHour: row.start_hour,
                            endHour: row.end_hour,
                            price: row.price,
                            sport: {
                                id: row.sport_id,
                                name: row.sport
                            },
                            address: {
                                cep: row.zipcode,
                                country: row.country,
                                state: row.state,
                                city: row.city,
                                neighbourhood: row.neighbourhood,
                                street: row.street,
                                number: row.number,
                                complement: row.complement
                            }
                        })

                    } else {

                        agenda.push({
                            id: row.id,
                            date: row.date,
                            establishment: {
                                id: row.establishment_id,
                                name: row.establishment
                            },
                            batteries: [{
                                id: row.battery_id,
                                booking: row.booking,
                                startHour: row.start_hour,
                                endHour: row.end_hour,
                                price: row.price,
                                sport: {
                                    id: row.sport_id,
                                    name: row.sport
                                },
                                address: {
                                    cep: row.zipcode,
                                    country: row.country,
                                    state: row.state,
                                    city: row.city,
                                    neighbourhood: row.neighbourhood,
                                    street: row.street,
                                    number: row.number,
                                    complement: row.complement
                                },
                                equipments: [{
                                    id: row.equipment_id,
                                    equipmentBatteryId: row.equipment_battery_id,
                                    name: row.equipment_name,
                                    description: row.equipment_description,
                                    price: row.equipment_price
                                }]
                            }]
                        })

                    }

                }

                return res.status(200).json({
                    success: true,
                    message: "Agenda obtida com sucesso!",
                    verbose: null,
                    data: {
                        schedules: agenda
                    }
                })

            })

    } catch (error) {
        handleError(req, res, 500, "Ocorreu um erro ao obter a agenda!", error)
    }

}

exports.favoriteEstablishments = async function (req, res) {

    const userId = req.decoded.data.userId

    try {

        const query = `
            (
            
                SELECT DISTINCT
                    e.id,
                    e.name,
                    e.professor,
                    true AS isIndicated,
                    false AS isFavorite,
                    ea.id AS addressId,
                    ea.type_id AS typeId,
                    ea.zipcode AS cep,
                    ea.country,
                    ea.state,
                    ea.city,
                    ea.neighbourhood,
                    ea.street,
                    ea.number,
                    ea.complement,
                    s.id AS sportId,
                    s.display_name AS sport
                FROM establishments e
                INNER JOIN establishments_indication ei
                    ON ei.establishment_id = e.id
                INNER JOIN users u
                    ON u.indication_id = ei.id
                INNER JOIN establishment_addresses ea
                    ON ea.establishment_id = e.id
                LEFT JOIN batteries b
                    ON b.establishment_id = e.id
                LEFT JOIN sports s
                    ON s.id = b.sport_id
                WHERE 
                    u.id = ?
                ORDER BY
                    isIndicated, 
                    e.name,
                    e.professor,
                    typeId,
                    ea.country,
                    ea.state,
                    ea.city,
                    ea.neighbourhood
            
            )

            UNION

            (
                
                SELECT DISTINCT
                    e.id,
                    e.name,
                    e.professor,
                    false AS isIndicated,
                    true AS isFavorite,
                    ea.id AS addressId,
                    ea.type_id AS typeId,
                    ea.zipcode AS cep,
                    ea.country,
                    ea.state,
                    ea.city,
                    ea.neighbourhood,
                    ea.street,
                    ea.number,
                    ea.complement,
                    s.id AS sportId,
                    s.display_name AS sport
                FROM establishments e
                INNER JOIN establishments_favorites ef
                    ON ef.establishment_id = e.id
                INNER JOIN users u
                    ON u.id = ef.user_id
                INNER JOIN establishment_addresses ea
                    ON ea.establishment_id = e.id
                LEFT JOIN batteries b
                    ON b.establishment_id = e.id
                LEFT JOIN sports s
                    ON s.id = b.sport_id
                WHERE
                    u.id = ?
                ORDER BY
                    isIndicated, 
                    e.name,
                    e.professor,
                    typeId,
                    ea.country,
                    ea.state,
                    ea.city,
                    ea.neighbourhood
            )
        `

        const queryParams = [
            userId,
            userId
        ]

        req.connection.query(query, queryParams, function (err, results, _) {

            if (err) {
                return handleError(req, res, 500, "Ocorreu um erro ao obter os estabelecimentos!", err)
            }

            const establishments = []

            for (row of results) {

                let filtered = establishments.findIndex(value => value.id === row.id)

                if (filtered >= 0) {

                    let addressFiltered = establishments[filtered].addresses.findIndex(value => value.id === row.addressId)

                    if (addressFiltered < 0) {

                        establishments[filtered].addresses.push({
                            id: row.addressId,
                            typeId: row.typeId,
                            cep: row.cep,
                            country: row.country,
                            state: row.state,
                            city: row.city,
                            neighbourhood: row.neighbourhood,
                            street: row.street,
                            number: row.number,
                            complement: row.complement
                        })

                    }

                    let sportsFiltered = establishments[filtered].sports.findIndex(value => value.id === row.sportId)

                    if (sportsFiltered < 0) {
                        establishments[filtered].sports.push({
                            id: row.sportId,
                            name: row.sport
                        })
                    }

                } else {

                    establishments.push({
                        id: row.id,
                        name: row.name,
                        professor: row.professor,
                        isIndicated: row.isIndicated,
                        isFavorite: row.isFavorite,
                        addresses: [{
                            id: row.addressId,
                            typeId: row.typeId,
                            cep: row.cep,
                            country: row.country,
                            state: row.state,
                            city: row.city,
                            neighbourhood: row.neighbourhood,
                            street: row.street,
                            number: row.number,
                            complement: row.complement
                        }],
                        sports: [{
                            id: row.sportId,
                            name: row.sport
                        }]
                    })

                }

            }

            return res.status(200).json({
                success: true,
                message: "Estabelecimentos favoritos listado com successo!",
                verbose: null,
                data: establishments
            })

        })

    } catch (err) {
        handleError(req, res, 500, "Ocorreu um erro ao obter os estabelecimentos!", err)
    }

}

exports.saveFavoriteEstablishment = async function (req, res) {

    const userId = req.decoded.data.userId
    const establishmentId = req.body.establishmentId

    req.assert('establishmentId', 'O id do estabelecimento deve ser informado!').notEmpty()

    try {

        if (validator.validateFields(req, res) != null)
            return

        let query = `
            SELECT 1
            FROM 
                establishments_favorites ef
            WHERE 
                ef.user_id = ?
                AND ef.establishment_id = ?
        `

        let queryParams = [
            userId,
            establishmentId
        ]

        req.connection.query(query, queryParams, function (err, results, _) {

            if (err) {
                return handleError(req, res, 500, "Ocorreu um erro ao salvar!", err)
            }

            query = `
                INSERT INTO establishments_favorites
                (
                    user_id, 
                    establishment_id
                )
                VALUES 
                (
                    ?, 
                    ?
                )
            `

            if (results.length != 0) {
                return res.status(200).json({
                    success: true,
                    message: "Estabelecimento salvo com sucesso!",
                    verbose: null,
                    data: null
                })
            }

            req.connection.query(query, queryParams, function (err, results, _) {

                if (err) {
                    return handleError(req, res, 500, "Ocorreu um erro ao salvar!", err)
                }

                return res.status(200).json({
                    success: true,
                    message: "Estabelecimento salvo com sucesso!",
                    verbose: null,
                    data: null
                })

            })

        })

    } catch (err) {
        handleError(req, res, 500, "Ocorreu um erro ao salvar!", err)
    }

}

exports.deleteFavoriteEstablishment = async function (req, res) {

    const userId = req.decoded.data.userId
    const establishmentId = req.body.establishmentId

    req.assert('establishmentId', 'O id do estabelecimento deve ser informado!').notEmpty()

    try {

        if (validator.validateFields(req, res) != null)
            return

        let query = `
            DELETE FROM 
                establishments_favorites
            WHERE 
                user_id = ?
                AND establishment_id = ?
        `

        let queryParams = [
            userId,
            establishmentId
        ]

        req.connection.query(query, queryParams, function (err, results, _) {

            if (err) {
                return handleError(req, res, 500, "Ocorreu um erro ao deletar dos favoritos!", err)
            }

            return res.status(200).json({
                success: true,
                message: "Estabelecimento deletado dos favoritos com sucesso!",
                verbose: null,
                data: null
            })

        })

    } catch (err) {
        handleError(req, res, 500, "Ocorreu um erro ao deletar dos favoritos!", err)
    }

}