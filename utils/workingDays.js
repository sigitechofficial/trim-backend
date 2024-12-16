exports.workingDays = (startDate, endDate) => {
  // Copy the start date to not modify the original date objects
  const current = new Date(startDate);
  const end = new Date(endDate);
  let weekdays = 0;

  // Loop through the dates, increment weekdays if the day is not Saturday (6) or Sunday (0)
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      weekdays += 1;
    }
    current.setDate(current.getDate() + 1); // Move to the next day
  }

  return weekdays;
};
