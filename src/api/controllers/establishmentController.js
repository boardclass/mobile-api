const Establishment = require('../models/Establishment')

const bcrypt = require('bcrypt')
const validator = require('../classes/validator')
const jwtHandler = require('../classes/jwt')

exports.store = async function(req, res) {

    const establishment = req.body

    req.assert('name', 'O nome deve ser informado').notEmpty()

    validator.validateFiels(req, res)

    const token = jwtHandler.generate(establishment.account.email)
    res.set('access-token', token)

    await bcrypt.hash(establishment.account.password, 10)
        .then(hash => {

            establishment.account.password = hash
            
            Establishment.findOrCreate({
                where: {
                    cnpj: establishment.cnpj
                },
                defaults: {
                    name: establishment.name,
                    account: establishment.account
                },
                include: {
                    association: 'account'
                }
            }).then(establishment, _ => {

                res.set('establishment-id', establishment[0].id)

                return res.status(200).json({
                    success: false,
                    message: "Estabelecimento cadastrado com sucesso!",
                    verbose: null,
                    data: {}
                })
                
            }).catch(error => {
                
                console.log('erro');

                return res.status(500).json({
                    success: false,
                    message: "Algo deu errado. Tente novamente mais tarde!",
                    verbose: `${error}`,
                    data: {}
                })
        
            })

        }).catch(error => {

            return res.status(500).json({
                success: false,
                message: "Ops, algo ocorreu. Tente novamente mais tarde!",
                verbose: `${error}`,
                data: {}
            })

        })

}

exports.login = async function(req, res) {

    

}

exports.storeBranch = async function(req, res) {}
exports.storeAddress = async function(req, res) {}
exports.storeEmployee = async function(req, res) {}