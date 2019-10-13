require('../models/user');
const mongoose = require('mongoose');
const UserModel = mongoose.model('User');

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