module.exports = {

    ADDRESS: {
        PHYSICAL_TYPE: 1,
        SERVICE_TYPE: 2
    },

    SCHEDULE_STATUS: {
        SCHEDULED: 1,
        CANCELED: 2,
        PAID: 3,
        PENDENT_PAYMENT: 4,
        PENDENT_AVALIATION: 5,
        CHECKIN: 6
    },

    SCHEDULE_ACTION: {
        CANCEL: "cancel",
        PAY: "pay",
        CHECKIN: "checkin"
    },

    ESTABLISHMENT_STATUS: {
        AVAILABLE: 1,
        CLOSED: 2,
        MAINTENANCE: 3,
        FULL: 4,
        SCHEDULES: 5,
        OTHER: 6,
        HOLIDAY: 10
    },

    USER_TYPE: {
        USER: 1,
        PROFESSOR: 2,
        ASSISTANT: 3
    }

}