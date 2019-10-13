const database = require('../../setup/database');

const UserSchema = new database.Schema({

    email: {
        type: String,
        required: true,
        unique: true
    },
    cpf: {
        type: String,
        required: false,
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
        required: false
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
        number: Number,
        complement: {
            type: String,
            required: false
        }
    },
    account: {
        authenticationToken: String,
        sessionToken: String,
        verification: {
            code: String,
            expiration: Date
        }
    }

}, {collection: 'users'});

database.mongoose.model('User', UserSchema);