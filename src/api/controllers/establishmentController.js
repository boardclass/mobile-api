const Establishment = require('../models/Establishment')
const EstablishmentAccount = require('../models/EstablishmentAccount')

const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

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

    

}

exports.storeBranch = async function (req, res) { }
exports.storeAddress = async function (req, res) { }
exports.storeEmployee = async function (req, res) { }