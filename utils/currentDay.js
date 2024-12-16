exports.currentDay = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding 1 to month and formatting to have leading zero if needed
  const day = String(currentDate.getDate()).padStart(2, '0'); // Formatting day to have leading zero if needed

  const currentDateOnly = `${year}-${month}-${day}`;

  return { currentDate, year, month, day, currentDateOnly };
};
