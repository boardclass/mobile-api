const jwtHandler = require('../api/common/classes/jwt')

module.exports = {

  validateToken: function (req, res, next) {

    let token = req.headers['access-token'] || req.headers['authorization']

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

  },

  versioning: function (req, res, next) {
    req.version = req.headers['accept-version'];
    
    if (req.version === undefined) {
      req.version = "v1"
    }

    next();
  }

}
