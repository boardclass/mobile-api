const bcrypt = require('bcrypt')

const validator = require('../classes/validator')
const math = require('../classes/math')
const date = require('../classes/date')
const logger = require('../classes/logger')
const mailer = require('../classes/mailer')
const jwtHandler = require('../classes/jwt')

const { connection } = require('../../config/database')

exports.sendSMS = function (req, res) {

    let userId = req.body.userId
    let phone = req.body.phone

    let verificationCode = math.getRandomNumber(1000, 9999)
    let expirationDate = date.addMinutes(new Date(), 3)

    req.assert('userId', 'O id do usuário deve ser informado').notEmpty()
    req.assert('phone', 'O telefone deve ser informado').notEmpty()
    req.assert('phone', 'O número do telefone é inválido').len(11)

    if (validator.validateFields(req, res) != null) {
        return
    }

    UserModel.findById(userId)
        .then(user => {

            user.account.verification.code = verificationCode
            user.account.verification.expiration = expirationDate

            user.save()
                .then(_ => {

                    return res.status(200).json({
                        success: true,
                        message: "Código enviado com sucesso",
                        data: {}
                    })

                }).catch(err => {

                    logger.register(error, req, _ => {

                        return res.status(500).json({
                            success: false,
                            message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                            verbose: err,
                            data: {}
                        })

                    })

                })

        }).catch(err => {

            logger.register(error, req, _ => {

                return res.status(500).json({
                    success: false,
                    message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                    verbose: err,
                    data: {}
                })

            })

        })

}

exports.validateSMS = function (req, res) {

    let userId = req.body.userId
    let verificationCode = req.body.verificationCode

    req.assert('userId', 'O id do usuário deve ser informado').notEmpty()
    req.assert('verificationCode', 'O código de verificação deve ser informado').notEmpty()
    req.assert('verificationCode', 'O código de verificação está inválido').len(4)

    if (validator.validateFields(req, res) != null) {
        return
    }

    UserModel.findById(userId)
        .then(user => {

            if (Date.now() > user.account.verification.expiration) {

                return res.status(400).json({
                    success: false,
                    message: "Seu código de validação expirou!",
                    data: {}
                })

            }

            if (verificationCode === user.account.verification.code) {

                return res.status(200).json({
                    success: true,
                    message: "Código de verificação válidado com sucesso!",
                    data: {}
                })

            }

            return res.status(500).json({
                success: false,
                message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                verbose: err,
                data: {}
            })

        }).catch(err => {

            logger.register(error, req, _ => {

                return res.status(500).json({
                    success: false,
                    message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                    verbose: err,
                    data: {}
                })

            })

        })

}

exports.tokenUserPassword = function (req, res) {

    const email = req.body.email

    let verificationCode = math.getRandomNumber(1000, 9999)

    req.assert('email', 'O email deve ser informado!').notEmpty()
    req.assert('email', 'O email está em formato inválido').isEmail()

    if (validator.validateFields(req, res) != null) {
        return
    }

    try {

        const query = `
                SELECT u.id 
                FROM users u 
                INNER JOIN user_accounts ac 
                    ON ac.user_id = u.id 
                WHERE ac.email = ?`

        connection.query(query, email,
            function (err, results, fields) {

                if (err) {

                    logger.register(err, req, _ => {
                        return res.status(500).json({
                            success: false,
                            message: "Ocorreu um erro na recuperação de senha!",
                            verbose: `${err}`,
                            data: {}
                        })

                    })

                }

                if (results.length == 0) {

                    return res.status(404).json({
                        success: true,
                        message: "Este email não consta em nossa base de dados!",
                        verbose: null,
                        data: {}
                    })

                }

                const userId = results[0].id

                connection.query(`UPDATE user_accounts 
                                    SET verification_code = ?, 
                                    code_expiration = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
                                    WHERE user_id = ?`, [verificationCode, userId],
                    function (err, results, fields) {

                        if (err) {

                            logger.register(err, req, _ => {
                                return res.status(500).json({
                                    success: false,
                                    message: "Ocorreu um erro na recuperação de senha!",
                                    verbose: `${err}`,
                                    data: {}
                                })

                            })

                        }

                        const data = {
                            destination: email,
                            subject: 'Recuperação de email solicitado!',
                            message: `Seu código de recuperação é: ${verificationCode}`
                        }

                        mailer.send(data, callback => {

                            if (callback == null) {

                                return res.status(500).json({
                                    success: false,
                                    message: "Falha ao enviar email!",
                                    verbose: null,
                                    data: {}
                                })

                            }

                            return res.status(200).json({
                                success: true,
                                message: "Token enviado com sucesso!",
                                verbose: null,
                                data: {}
                            })

                        })

                    })

            })

    } catch (error) {

        logger.register(error, req, _ => {

            return res.status(500).json({
                success: false,
                message: "Ocorreu um erro ao enviar o email!",
                verbose: `${error}`,
                data: {}
            })

        })

    }

}

exports.validateUserPassword = async function (req, res) {

    const code = req.body.code
    const email = req.body.email

    req.assert('code', 'O código deve ser informado!').notEmpty()
    req.assert('code', 'O código está em formato inválido!').len(4)
    req.assert('email', 'O email deve ser informado!').notEmpty()
    req.assert('email', 'O email está em formato inválido').isEmail()

    if (validator.validateFields(req, res) != null) {
        return
    }

    try {

        mysql.connect(mysql.uri, connection => {

            const query = `
                SELECT user_id
                FROM user_accounts
                WHERE email = ?
                AND verification_code = ? 
                AND code_expiration > NOW()`

            connection.query(query, [email, code],
                function (err, results, fields) {

                    if (err) {

                        logger.register(err, req, _ => {
                            return res.status(500).json({
                                success: false,
                                message: "Ocorreu um erro na recuperação de senha!",
                                verbose: `${err}`,
                                data: {}
                            })

                        })

                    }

                    if (results.length == 0) {

                        return res.status(404).json({
                            success: true,
                            message: "Este código está incorreto ou expirado!",
                            verbose: null,
                            data: {}
                        })

                    }

                    const userId = results[0].user_id
                    res.setHeader('access-token', jwtHandler.generate(userId, null))

                    return res.status(200).json({
                        success: true,
                        message: "Código validado com sucesso!",
                        verbose: null,
                        data: {}
                    })

                })

        })

    } catch (error) {

        logger.register(error, req, _ => {

            return res.status(500).json({
                success: false,
                message: "Ocorreu um erro na recuperação de senha!",
                verbose: `${error}`,
                data: {}
            })

        })

    }

}

exports.resetUserPassword = async function (req, res) {

    const userId = req.decoded.userId
    const password = req.body.password

    req.assert('password', 'A senha deve ser informada!').notEmpty()

    if (validator.validateFields(req, res) != null) {
        return
    }

    try {

        const cryptedPassword = await bcrypt.hash(password, 10)

        mysql.connect(mysql.uri, connection => {

            connection.query(`UPDATE user_accounts SET password = '${cryptedPassword}' WHERE user_id = ?`, [userId],
                function (err, results, fields) {

                    if (err) {

                        console.log(err);

                        return res.status(500).json({
                            success: false,
                            message: "Ocorreu um erro na recuperação de senha!",
                            verbose: `${err}`,
                            data: {}
                        })

                    }

                    const token = jwtHandler.generate(userId, null)
                    res.setHeader('access-token', token)

                    return res.status(200).json({
                        success: true,
                        message: "Senha alterada com sucesso!",
                        verbose: null,
                        data: {}
                    })

                })

        })

    } catch (error) {

        logger.register(error, req, _ => {

            return res.status(500).json({
                success: false,
                message: "Ocorreu um erro na alterar a senha!",
                verbose: `${error}`,
                data: {}
            })

        })

    }

}

exports.resetEstablishmentPassword = function (req, res) { }

exports.validateEstablishmentPassword = function (req, res) { }