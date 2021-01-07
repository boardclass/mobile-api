const pdf = require('html-pdf');
const root = require('./root');

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

        let filePath = `/src/files/test.pdf`

        pdf.create(content, options).toFile(filePath, function (err, file) {
            callback(err, file)
        })

    }

}