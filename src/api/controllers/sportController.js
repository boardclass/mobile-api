const { connection } = require('../../config/database')
const { handleError } = require('../classes/error-handler')

exports.all = async function (req, res) {

    try {

        const query = `
            SELECT 
                id,
                display_name AS name 
            FROM sports
            ORDER BY name
        `

        connection.query(query, [], function (err, result, _) {

            if (err)
                return handleError(req, res, 500, "Ocorreu um erro ao obter os esportes!", err)

            return res.status(200).json({
                success: true,
                message: "Busca realizada com sucesso!",
                verbose: null,
                data: { sports: result }
            })

        })

    } catch (err) {
        return handleError(req, res, 500, "Ocorreu um erro ao obter os esportes!", err)
    }

}