const moment = require('moment');

const createLastNDaysArray = n => {
  const lastNDays = {};
  [...new Array(n)].forEach((val, i) => {
    lastNDays[
      moment()
        .startOf('day')
        .subtract(n - i - 1, 'days')
        .format('YYYY-MM-DD')
    ] = 0;
  });

  return lastNDays;
};

module.exports = {
  createLastNDaysArray
};
