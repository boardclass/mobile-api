const pdf = require('html-pdf');
const randomstring = require("randomstring")

module.exports = {

    generate: function (content, callback) {

        let options = {
            format: 'A3',
            orientation: 'landscape'
        }

        pdf.create(content, options).toBuffer(function (err, buffer) {
            callback(err, buffer)
        })

    },

    generateFile: function (content, callback) {

        let options = {
            format: 'A3',
            orientation: 'landscape'
        }

        pdf.create(content, options).toFile(`./files/pdf/extract_${randomstring.generate(6)}.pdf`, function (err, file) {
            callback(err, file)
        })

    }

}