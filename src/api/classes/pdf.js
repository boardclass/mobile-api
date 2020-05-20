const pdf = require('html-pdf')

module.exports = {

    generate: function (content, filename) {

        pdf.create(content, {}).toFile(`./temp/pdf/${filename}.pdf`, (err, res) => {

            if (err)
                console.log(err)
            else 
                console.log(res)
                
        })

    }

}