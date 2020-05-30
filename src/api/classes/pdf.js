const pdf = require('html-pdf')

module.exports = {

    generate: function (content, callback) {

        let options = {
            format: 'A2',
            orientation: 'portrait'
        }

        pdf.create(content, options).toBuffer(function (err, buffer) {
            callback(buffer)
        })

    }

}