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

    validateFields: function(req, object) {

        let error = req.validationErrors()
    
        if (error) {
            
            object = {
                success: false,
                message: error[0].msg,
                verbose: error[0],
                data: {}
            }
    
        }

    }

}