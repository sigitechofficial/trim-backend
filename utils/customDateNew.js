const moment = require('moment');

const CustomDateNew = {
    /**
     * Get today's date info
     * @returns {Object} { currentDateOnly, dayName, currentTime }
     */
    currentDay: () => {
        const now = moment();
        return {
            currentDateOnly: now.format('YYYY-MM-DD'), // e.g. "2025-09-09"
            dayName: now.format('dddd'),               // e.g. "Tuesday"
            currentTime: now.format('hh:mm A'),        // e.g. "07:45 PM"
        };
    },

    /**
     * Get the day name for a given date
     * @param {string} date - "YYYY-MM-DD"
     * @returns {string} day name (e.g. "Monday")
     */
    getDayName: (date) => {
        return moment(date, 'YYYY-MM-DD').format('dddd');
    },
};

module.exports = CustomDateNew;
