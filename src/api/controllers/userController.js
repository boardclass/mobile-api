const User = require('../models/User')
const UserAddress = require('../models/UserAddress')
const UsersRoles = require('../models/UsersRoles')

const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')

exports.login = async function (req, res) {

    let email = req.body.email
    let password = req.body.password

    req.assert('email', 'O email deve ser informado')
    req.assert('password', 'A senha deve ser informado')

    validator.validateFiels(req, res)

    try {

        const user = await User.findOne({
            include: {
                association: 'account',
                where: {
                    email
                }
            }
        })

        if (!user) {

            return res.status(404).json({
                success: true,
                message: "Este email não está cadastrado em nossa base!",
                verbose: null,
                data: {}
            })

        }

        const matchPassword = await bcrypt.compare(password, user.account.password)

        if (!matchPassword) {

            return res.status(404).json({
                success: true,
                message: "Não foi possível realizar o login, senha incorreta!",
                verbose: null,
                data: {}
            })

        }

        const token = jwtHandler.generate(user.id)

        res.setHeader('access-token', token)

        return res.status(200).json({
            success: true,
            message: "Login realizado com sucesso!",
            verbose: null,
            data: {}
        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao realizar o login!",
            verbose: `${error}`,
            data: {}
        })

    }

}

exports.store = async function (req, res) {

    const user = req.body
    const account = req.body.account

    req.assert('name', 'O nome deve ser informado').notEmpty()
    req.assert('cpf', 'O CPF deve ser informado').notEmpty()
    req.assert('cpf', 'O CPF está com formato inválido').len(11)
    req.assert('cpf', 'O CPF está deve conter apenas números').isNumeric()
    req.assert('phone', 'O telefone deve ser informado').notEmpty()
    req.assert('phone', 'O telefone está com formato inválido').len(13)
    req.assert('phone', 'O telefone deve conter apenas números').isNumeric()
    req.assert('account.roleId', 'A permissão do usuário deve ser informada').notEmpty()
    req.assert('account.email', 'O email deve ser informado').notEmpty()
    req.assert('account.email', 'O email está em formato inválido').isEmail()
    req.assert('account.password', 'A senha deve ser informada').notEmpty()

    validator.validateFiels(req, res)

    const token = jwtHandler.generate(account.email)

    try {

        account.password = await bcrypt.hash(account.password, 10)

        const newUser = await User.findOrCreate({
            where: {
                cpf: user.cpf
            },
            defaults: {
                name: user.name,
                phone: user.phone,
                account: account
            },
            include: [
                { association: 'account' },
                { association: 'addresses' }
            ]
        })

        res.setHeader('access-token', token)
        res.setHeader('user-id', newUser[0].id)

        return res.status(200).json({
            success: true,
            message: "Usuário cadastrado com sucesso!",
            verbose: null,
            data: { }
        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao cadastrar o usuário!",
            verbose: `${error}`,
            data: {}
        })

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

    validator.validateFiels(req, res)

    try {

        await UserAddress.create({
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

        return res.status(200).json({
            success: true,
            message: "Endereço cadastrado com sucesso!",
            verbose: null,
            data: {}
        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao cadastrar o endereço!",
            verbose: `${error}`,
            data: {}
        })

    }

}

exports.storeRole = async function (req, res) {

    const user_id = req.params.user_id
    const role_id = req.body.role_id

    req.assert('role_id', 'A permissão deve ser informada!').notEmpty()

    try {

        validator.validateFiels(req, res)

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

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao cadastrar esse usuário!",
            verbose: `${error}`,
            data: {}
        })

    }

}