const { handleError } = require('../../common/classes/error-handler')

exports.all = async function (req, res) {

    try {

        const query = `
            SELECT 
                id,
                display_name AS name 
            FROM sports
            ORDER BY name
        `

        req.connection.query(query, [], function (err, result, _) {

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