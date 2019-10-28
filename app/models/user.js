const database = require('../../setup/database')

const UserSchema = new database.Schema({

    cpf: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: false
    },
    birthday: {
        type: Date,
        required: false
    },
    phone: {
        type: String,
        unique: true,
        required: true
    },
    registerDate: {
        type: Date,
        default: Date.now()
    },
    address: {
        cep: String,
        country: String,
        state: String,
        city: String,
        neighbourhood: String,
        street: String,
        number: String,
        complement: String
    },
    account: {
        role: {
            type: String,
            required: true
        },
        email: {
            type: String,
            unique: true,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        authenticationToken: String,
        sessionToken: String,
        verification: {
            code: String,
            expiration: Date
        }
    }

}, {collection: 'users'})

database.mongoose.model('User', UserSchema)