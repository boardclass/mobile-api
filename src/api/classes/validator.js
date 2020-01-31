module.exports = {

    validateFiels: function(req, res) {

        let error = req.validationErrors()
    
        if (error) {
    
            let message = error[0].msg
            return res.status(400).json({
                success: false,
                message: message,
                verbose: error[0],
                data: {}
            })
    
        }
        
    },

    validateFiedls: function(req, res) {

        let error = req.validationErrors()
    
        if (error) {
            
            console.log(error);

            let message = error[0].msg
            return res.status(400).json({
                success: false,
                message: message,
                verbose: error[0],
                data: {}
            })
    
        } else {
            return null
        }
        
    }

}