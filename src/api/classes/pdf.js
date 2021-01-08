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

        pdf.create(content, options).toFile('../../test.pdf', function (err, file) {
            callback(err, file)
        })

    }

}