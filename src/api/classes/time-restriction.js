var { DateTime } = require('luxon');
const date = require('./date')
const minutesRestriction = 120

exports.isRestricted = function(hour) {
    const localDate = DateTime.local().setZone('America/Sao_Paulo').plus({ minutes: minutesRestriction })
    const localTime = localDate.toLocaleString(DateTime.TIME_24_WITH_SECONDS)
    return localTime > hour
}