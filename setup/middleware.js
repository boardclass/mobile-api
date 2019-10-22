let jwt = require('jsonwebtoken')
const jwtHandler = require('../app/classes/jwt')

module.exports = {

  validateToken: function (req, res, next) {

    let token = req.headers['x-access-token'] || req.headers['authorization']

    if (token) {

      if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length)
      }

      jwtHandler.validate(req, res, token, _ => {
        next()
      })

    } else {

      return res.status(400).json({
        success: false,
        message: 'Auth token is not supplied',
        verbose: '',
        data: {}
      })

    }

  }

}
