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

        let filePath = `${root}/src/files`

        pdf.create(content, options).toFile(filePath, function (err, file) {
            callback(err, file)
        })

    }

}