require('../models/user');
const mongoose = require('mongoose');
const UserModel = mongoose.model('User');
const statusCode = require('../classes/statusCode');

exports.registerData = function (req, res) {

    let user = new UserModel(req.body);

    req.assert('name', 'O nome deve ser informado').notEmpty();
    req.assert('surname', 'O sobrenome deve ser informado').notEmpty();
    req.assert('email', 'O email deve ser informado').notEmpty();

    let error = req.validationErrors();

    if (error) {

        let message = error[0].msg;
        return res.status(400).json({
            success: false,
            message: message,
            verbose: error[0],
            data: {}
        });

    }

    user.save({}, function (err, result) {

        if (err) {

            if (err.code === statusCode.duplicated) {

                return res.status(400).json({
                    success: false,
                    message: "Esse email já está sendo utilizado",
                    verbose: err,
                    data: {}
                });

            }

            return res.status(500).json({
                success: false,
                message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                verbose: err,
                data: {}
            });

        }

        return res.status(200).json({
            success: true,
            message: "Cadastro realizado com sucesso",
            verbose: "",
            data: {
                "userId": result._id
            }
        });

    });

};

exports.updatePhone = function (req, res) {

    let userId = req.params.userId;
    let phone = req.body.phone;

    req.assert('phone', 'O telefone deve ser informado').notEmpty();

    let error = req.validationErrors();

    if (error) {

        let message = error[0].msg;
        return res.status(400).json({
            success: false,
            message: message,
            verbose: error[0],
            data: {}
        });

    }

    let conditions = { _id: userId }

    UserModel.findOne(conditions)
        .then(user => {

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Usuário não encontrado!",
                    verbose: "",
                    data: {}
                })
            }

            user.phone = phone

            user.save()
                .then(result => {

                    return res.status(200).json({
                        success: true,
                        message: "Telefone registrado com sucesso!",
                        verbose: "",
                        data: { "user": result }
                    })

                })
                .catch(err => {

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

};

exports.updateAddress = function (req, res) {

    let userId = req.params.userId;
    let address = req.body.address;

    req.assert('address.cep', 'O CEP deve ser informado').notEmpty();
    req.assert('address.cep', 'O CEP está inválido').len(8);
    req.assert('address.country', 'O País deve ser informado').notEmpty();
    req.assert('address.state', 'O Estado ser informado').notEmpty();
    req.assert('address.city', 'A Cidade deve ser informado').notEmpty();
    req.assert('address.neighbourhood', 'O Bairro deve ser informado').notEmpty();
    req.assert('address.street', 'A Rua deve ser informado').notEmpty();
    req.assert('address.number', 'O Número deve ser informado').notEmpty();

    let error = req.validationErrors();

    if (error) {

        let message = error[0].msg;
        return res.status(400).json({
            success: false,
            message: message,
            verbose: error[0],
            data: {}
        });

    }

    let conditions = { _id: userId }

    UserModel.findOne(conditions)
        .then(user => {

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Usuário não encontrado!",
                    verbose: "",
                    data: {}
                })
            }

            user.address = address

            user.save()
                .then(result => {

                    return res.status(200).json({
                        success: true,
                        message: "Endereço registrado com sucesso!",
                        verbose: "",
                        data: { "user": result }
                    })

                })
                .catch(err => {

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

};