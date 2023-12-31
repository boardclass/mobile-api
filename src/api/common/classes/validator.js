module.exports = {

    validateFields: function(req, res) {

        let error = req.validationErrors()
    
        if (error) {

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