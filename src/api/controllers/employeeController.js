const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')

const { handleError } = require('../classes/error-handler')
const { USER_TYPE } = require('../classes/constants')

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
    req.assert('phone', 'O formato do telefone está inválido, exemplo de formato correto: 5511912345678').len(13)
    req.assert('phone', 'O telefone deve conter apenas números').isNumeric()
    req.assert('account.email', 'O email deve ser informado').notEmpty()
    req.assert('account.email', 'O email está em formato inválido').isEmail()
    req.assert('account.password', 'A senha deve ser informada').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        account.password = await bcrypt.hash(account.password, 10)

        let query = `
            SELECT 
                u.id,
                ur.role_id AS roleId
            FROM users u
            INNER JOIN user_accounts ua 
                ON ua.user_id = u.id
            INNER JOIN users_roles ur
                ON ur.user_id = u.id
            WHERE 
                u.cpf = ?
                OR u.phone = ?
                OR ua.email = ?
            ORDER BY ur.role_id DESC
        `

        let queryValues = [
            cpf,
            phone,
            account.email
        ]

        req.connection.beginTransaction(function (err) {

            if (err) {
                return req.connection.rollback(function () {
                    handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
                })
            }

            req.connection.query(query, queryValues, function (err, result, _) {

                if (err)
                    return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
                
                if (result.length == 0) {

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

                    req.connection.query(query, queryValues, function (err, result, _) {

                        if (err) {
                            return req.connection.rollback(function () {
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

                        req.connection.query(query, queryValues, function (err, result, _) {

                            if (err) {
                                return req.connection.rollback(function () {
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

                            req.connection.query(query, queryValues, function (err, result, _) {

                                if (err) {
                                    return req.connection.rollback(function () {
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

                                req.connection.query(query, queryValues, function (err, result, _) {

                                    if (err) {
                                        return req.connection.rollback(function () {
                                            handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
                                        })
                                    }

                                    req.connection.commit(function (err) {

                                        if (err) {
                                            return conn.rollback(function () {
                                                handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                                            })
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

                } else {

                    const userId = result[0].id

                    if (result[0].roleId === USER_TYPE.ASSISTANT) {

                        query = `
                            SELECT * 
                            FROM establishment_employees
                            WHERE 
                                user_id = ? 
                                AND establishment_id = ?
                        `

                        queryValues = [
                            userId,
                            establishmentId
                        ]

                        req.connection.query(query, queryValues, function (err, result, _) {

                            if (err) {
                                return req.connection.rollback(function () {
                                    handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
                                })
                            }

                            if (result.length != 0) {

                                return res.status(400).json({
                                    success: true,
                                    message: "Auxiliar já está cadastrado para este estabelecimento!",
                                    verbose: null,
                                    data: {}
                                })

                            } else {

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
                                    userId
                                ]

                                req.connection.query(query, queryValues, function (err, result, _) {

                                    if (err) {
                                        return req.connection.rollback(function () {
                                            handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
                                        })
                                    }

                                    req.connection.commit(function (err) {

                                        if (err) {
                                            return conn.rollback(function () {
                                                handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                                            })
                                        }

                                        return res.status(200).json({
                                            success: true,
                                            message: "Cadastro realizado com sucesso!",
                                            verbose: null,
                                            data: {}
                                        })

                                    })

                                })

                            }

                        })

                    } else if (result[0].roleId === USER_TYPE.USER) {

                        query = `
                        INSERT INTO users_roles
                        (
                            user_id,
                            role_id
                        )
                        VALUES
                        (
                            ?,
                            ?
                        )
                    `

                        queryValues = [
                            userId,
                            USER_TYPE.ASSISTANT
                        ]

                        req.connection.query(query, queryValues, function (err, result, _) {

                            if (err) {
                                return req.connection.rollback(function () {
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
                                userId
                            ]

                            req.connection.query(query, queryValues, function (err, result, _) {

                                if (err) {
                                    return req.connection.rollback(function () {
                                        handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
                                    })
                                }

                                req.connection.commit(function (err) {

                                    if (err) {
                                        return conn.rollback(function () {
                                            handleError(req, res, 500, "Ocorreu um erro ao adicionar a bateria!", err)
                                        })
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

                    }

                }

            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao cadastrar o professor!", err)
    }

}

exports.getEmployeeByCPF = async function (req, res) {

    let cpf = req.params.cpf

    try {

        let query = `
            SELECT  
                u.id,
                u.name,
                u.cpf,
                u.phone,
                uc.email
            FROM users u
            INNER JOIN user_accounts uc
                ON uc.user_id = u.id
            WHERE 
                u.cpf = ?
        `

        let params = [
            cpf
        ]

        req.connection.query(query, params, function(err, result, _) {

            if (err) {
                return handleError(req, res, 500, "Ocorreu um erro ao recuperar usuário", err)
            }

            let user = result

            if (result.length == 0) {
                user = null
            } else {
                user = result[0]
            }

            return res.status(200).json({
                success: true,
                message: "Dados recuperado com sucesso!",
                verbose: null,
                data: user
            })

        })

    } catch (error) {
        handleError(req, res, 500, "Ocorreu um erro ao recuperar usuário", error)
    }

}

exports.login = async function (req, res) {

    const users = []
    const email = req.body.email
    const password = req.body.password

    req.assert('email', 'O email deve ser informada').notEmpty()
    req.assert('email', 'O email está em formato inválido').isEmail()
    req.assert('password', 'A senha deve ser informada').notEmpty()

    if (validator.validateFields(req, res) != null)
        return

    try {

        let query = `
            SELECT
                u.id,
                u.name,
                u.cpf,
                u.phone,
                ua.password,
                ee.establishment_id,
                e.name AS establishment_name
            FROM
                users u
            INNER JOIN user_accounts ua ON
                ua.user_id = u.id
            INNER JOIN establishment_employees ee ON
                ee.user_id = u.id
            INNER JOIN establishments e ON
                e.id = ee.establishment_id
            INNER JOIN users_roles ur
                ON ur.user_id = u.id
                AND ur.role_id = ?
            WHERE
                ua.email = ?
        `

        let params = [
            USER_TYPE.ASSISTANT,
            email
        ]

        req.connection.query(query, params, async function (err, results, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao realizar o login!", err)

            if (results.length == 0) {

                return res.status(404).json({
                    success: true,
                    message: "Este email não está cadastrado em nossa base!",
                    verbose: null,
                    data: {}
                })

            }

            const matchPassword = await bcrypt.compare(password, results[0].password)

            if (!matchPassword) {

                return res.status(404).json({
                    success: true,
                    message: "Sua senha está incorreta!",
                    verbose: null,
                    data: {}
                })

            }

            for (row of results) {

                let filteredUser = users.findIndex(value => {
                    return value.id === row.id
                })

                if (filteredUser >= 0) {

                    users[filtered].establishments.push({
                        id: row.establishment_id,
                        name: row.establishment_name,
                    })

                } else {

                    users.push({
                        id: row.id,
                        name: row.name,
                        cpf: row.cpf,
                        phone: row.phone,
                        establishments: [{
                            id: row.establishment_id,
                            name: row.establishment_name,
                        }]
                    })

                }

            }

            const firstEstablishmentId = users[0].establishments[0].id

            res.setHeader('role-id', USER_TYPE.ASSISTANT)
            res.setHeader('user-id', users[0].id)
            res.setHeader('establishment-id', firstEstablishmentId)
            res.setHeader('access-token', jwtHandler.generate(users[0].id, firstEstablishmentId))

            return res.status(200).json({
                success: true,
                message: "Login realizado com ucesso!",
                verbose: null,
                data: users[0]
            })

        })


    } catch (error) {
        handleError(req, res, 500, "Ocorreu um erro ao realizar o login!", err)
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

        req.connection.query(query, queryValues, function (err, result, _) {

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