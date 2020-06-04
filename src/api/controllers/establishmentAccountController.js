const bcrypt = require('bcrypt')

const math = require('../classes/math')
const validator = require("../classes/validator")
const jwtHandler = require("../classes/jwt")

const { handleError } = require('../classes/error-handler')

exports.tokenPassword = function (req, res) {

    const email = req.body.email

    let verificationCode = math.getRandomNumber(1000, 9999)

    req.assert('email', 'O email deve ser informado!').notEmpty()
    req.assert('email', 'O email está em formato inválido').isEmail()

    if (validator.validateFields(req, res) != null) {
        return
    }

    try {

        const query = `
                SELECT 
                    e.id 
                FROM establishments e
                INNER JOIN establishment_accounts ea 
                    ON ea.establishment_id = e.id
                WHERE ea.email = ?`

        req.connection.query(query, email,
            function (err, results, _) {

                if (err) {
                    return handleError(req, res, 500, "Ocorreu um erro na recuperação de senha!", err)
                }

                if (results.length == 0) {

                    return res.status(404).json({
                        success: true,
                        message: "Este email não consta em nossa base de dados!",
                        verbose: null,
                        data: {}
                    })

                }

                const establishmentId = results[0].id

                req.connection.query(`UPDATE establishment_accounts 
                                SET verification_code = ?, 
                                code_expiration = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
                                WHERE establishment_id = ?`, [verificationCode, establishmentId],
                    function (err, results, _) {

                        if (err) {
                            return handleError(req, res, 500, "Ocorreu um erro na recuperação de senha!", err)
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

    } catch (err) {

        return handleError(req, res, 500, "Ocorreu um erro na recuperação de senha!", err)

    }

}

exports.validatePassword = function (req, res) {

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

        const query = `
                SELECT establishment_id
                FROM establishment_accounts
                WHERE email = ?
                AND verification_code = ? 
                AND code_expiration > NOW()`

        req.connection.query(query, [email, code],
            function (err, results, fields) {

                if (err) {
                    return handleError(req, res, 500, "Ocorreu um erro na recuperação de senha!", err)
                }

                if (results.length == 0) {

                    return res.status(404).json({
                        success: true,
                        message: "Este código está incorreto ou expirado!",
                        verbose: null,
                        data: {}
                    })

                }

                const establishmentId = results[0].establishment_id
                res.setHeader('access-token', jwtHandler.generate(null, establishmentId))

                return res.status(200).json({
                    success: true,
                    message: "Código validado com sucesso!",
                    verbose: null,
                    data: {}
                })

            })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro na recuperação de senha!", err)
    }

}

exports.resetPassword = async function (req, res) {

    const establishmentId = req.decoded.data.establishmentId
    const password = req.body.password

    req.assert('password', 'A senha deve ser informada!').notEmpty()

    if (validator.validateFields(req, res) != null) {
        return
    }

    try {

        const cryptedPassword = await bcrypt.hash(password, 10)

        req.connection.query(`UPDATE establishment_accounts 
                        SET password = '${cryptedPassword}' 
                        WHERE establishment_id = ?`, [establishmentId],
            function (err, results, fields) {

                if (err) {
                    return handleError(req, res, 500, "Ocorreu um erro na recuperação de senha!", err)
                }

                const token = jwtHandler.generate(null, establishmentId)
                res.setHeader('access-token', token)

                return res.status(200).json({
                    success: true,
                    message: "Senha alterada com sucesso!",
                    verbose: null,
                    data: {}
                })

            })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro na alterar a senha!", err)
    }

}
