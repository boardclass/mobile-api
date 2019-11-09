const mongoose = require('mongoose')

const AddressSchema = new mongoose.Schema({

    cep: String,
    country: String,
    state: String,
    city: String,
    neighbourhood: String,
    street: String,
    number: String,
    complement: String

}, { collection: 'addresses' })

mongoose.model('address', AddressSchema)

module.exports = {
    model: AddressSchema
}