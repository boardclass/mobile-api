require('../models/user')
const mongoose = require('mongoose')
const UserModel = mongoose.model('User')
const math = require('../classes/math');
const date = require('../classes/date');

exports.sendSMS = function(req, res) {

    let userId = req.body.userId
    let phone = req.body.phone

    let verificationCode = math.getRandomNumber(1000, 9999);
    let expirationDate = date.addMinutes(new Date(), 3);

    req.assert('userId', 'O id do usuário deve ser informado').notEmpty()
    req.assert('phone', 'O telefone deve ser informado').notEmpty()
    req.assert('phone', 'O número do telefone é inválido').len(11)

    let error = req.validationErrors()

    if (error) {

        let message = error[0].msg;
        return res.status(400).json({
            success: false,
            message: message,
            verbose: error[0],
            data: {}
        })

    }

    UserModel.findById(userId)
        .then(user => {

            user.account.verification.code = verificationCode
            user.account.verification.expiration = expirationDate

            user.save()
                .then( _ => {

                    return res.status(200).json({
                        success: true,
                        message: "Código enviado com sucesso",
                        data: {}
                    })

                }).catch(err => {

                    return res.status(500).json({
                        success: false,
                        message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                        verbose: err,
                        data: {}
                    })

                })

        }).catch(err => {

            return res.status(500).json({
                success: false,
                message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                verbose: err,
                data: {}
            })

        })

}

exports.validateSMS = function(req, res) {

    let userId = req.body.userId
    let verificationCode = req.body.verificationCode

    req.assert('userId', 'O id do usuário deve ser informado').notEmpty()
    req.assert('verificationCode', 'O código de verificação deve ser informado').notEmpty()
    req.assert('verificationCode', 'O código de verificação está inválido').len(4)

    let error = req.validationErrors()

    if (error) {

        let message = error[0].msg;
        return res.status(400).json({
            success: false,
            message: message,
            verbose: error[0],
            data: {}
        })

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
            
            return res.status(500).json({
                success: false,
                message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                verbose: err,
                data: {}
            })

        })

}