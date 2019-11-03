const database = require('../../setup/database')

const AddressSchema = new database.Schema({

    cep: String,
    country: String,
    state: String,
    city: String,
    neighbourhood: String,
    street: String,
    number: String,
    complement: String

}, { collection: 'addresses' })

module.exports = {
    model: AddressSchema
}