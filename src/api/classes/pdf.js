const pdf = require('html-pdf');

module.exports = {

    generate: function (content, callback) {

        let options = {
            format: 'A2',
            orientation: 'landscape'
        }

        pdf.create(content, options).toBuffer(function (err, buffer) {
            callback(err, buffer)
        })

    },

    generateFile: function (content, callback) {

        let options = {
            format: 'A2',
            orientation: 'landscape'
        }

        let filePath = `${__dirname}/src/files`

        pdf.create(content, options).toFile(filePath, function (err, file) {
            callback(err, file)
        })

    }

}