const Establishment = require('../models/Establishment')
const EstablishmentAddress = require('../models/EstablishmentAddress')

const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const constants = require('../classes/constants')

exports.store = async function (req, res) {

    const establishment = req.body

    req.assert('name', 'O nome deve ser informado').notEmpty()
    req.assert('account.email', 'O email deve ser informado').notEmpty()
    req.assert('account.password', 'A senha deve ser informada').notEmpty()

    validator.validateFiels(req, res)

    if (establishment.cnpj === undefined)
        establishment.cnpj = null

    const token = jwtHandler.generate(establishment.account.email)
    res.setHeader('access-token', token)

    try {

        const hashedPassword = await bcrypt.hash(establishment.account.password, 10)

        establishment.account.password = hashedPassword

        const newEstablishment = await Establishment.findOrCreate({
            where: {
                [Op.or]: [
                    { cnpj: establishment.cnpj },
                    { name: establishment.name }
                ]
            },
            defaults: {
                name: establishment.name,
                cnpj: establishment.cnpj,
                account: establishment.account
            },
            include: {
                association: 'account'
            }
        })

        res.set('establishment-id', newEstablishment[0].id)

        return res.status(200).json({
            success: true,
            message: "Estabelecimento cadastrado com sucesso!",
            verbose: null,
            data: {}
        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao cadastrar o estabelecimento!",
            verbose: `${error}`,
            data: {}
        })

    }

}

exports.login = async function (req, res) {

    let email = req.body.email
    let password = req.body.password

    req.assert('email', 'O email deve ser informado')
    req.assert('password', 'A senha deve ser informado')

    validator.validateFiels(req, res)

    const token = jwtHandler.generate(email)

    try {
        
        const establishment = await Establishment.findOne({
            include: {
                association: 'account',
                where: {
                    email
                }
            }
        })

        if (!establishment) {

            return res.status(404).json({
                success: true,
                message: "Este email não está cadastrado em nossa base!",
                verbose: null,
                data: {}
            })

        }

        const matchPassword = await bcrypt.compare(password, establishment.account.password)

        if (!matchPassword) {

            return res.status(404).json({
                success: true,
                message: "Não foi possível realizar o login, senha incorreta!",
                verbose: null,
                data: {}
            })

        }

        res.setHeader('access-token', token)
        res.setHeader('user-id', establishment.id)

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

exports.storeAddress = async function (req, res) { 

    let establishment_id = req.params.establishment_id
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

        await EstablishmentAddress.create({
            zipcode,
            country,
            state,
            city,
            neighbourhood,
            street,
            number,
            complement,
            type_id: constants.PHYSICAL_ADDRESS_TYPE,
            establishment_id,
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

exports.storeBranch = async function (req, res) { }

exports.storeEmployee = async function (req, res) { }

exports.filter = async function (req, res) {
    
    let sportId = req.body.sportId
    let establishmentId = req.body.establishmentId
    let address = req.body.address
    
    const token = jwtHandler.generate(email)

    try {

        const establishment = await Establishment.find({
            include: [{
                association: 'scheduling_sessions', // TODO make connection
                where: {
                    [Op.or]: [
                        { sport_id: sportId },
                        { 'establishments_addresses.type_id': constants.PHYSICAL_ADDRESS_TYPE },
                        { 'establishments_addresses.country': address.country },
                        { 'establishments_addresses.state': address.state },
                        { 'establishments_addresses.city': address.city },
                        { 'establishments_addresses.neighbourhood': address.neighbourhood }
                    ]
                }
            }]
        })

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Ocorreu um erro ao filtrar!",
            verbose: `${error}`,
            data: {}
        })

    }

}