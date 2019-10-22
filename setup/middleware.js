let jwt = require('jsonwebtoken')
const jwtEnv = require('./jwt')

const validateToken = (req, res, next) => {

  let token = req.headers['x-access-token'] || req.headers['authorization']

  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length)
  }

  if (token) {
    jwt.verify(token, jwtEnv.secret, (err, decoded) => {

      if (err) {

        return res.status(400).json({
          success: false,
          message: 'Token is not valid',
          verbose: err,
          data: {}
        })

      } else {
        req.decoded = decoded
        next()
      }

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

module.exports = {
  validateToken
}
