 
exports.finalcialReport = data => {
  let resultArray = [];

  // Use Object.keys() to get an array of the object's keys, then iterate with forEach
  Object.keys(data).forEach(key => {
      resultArray.push(data[key]);
  });

  return resultArray;
}

exports.getMonthName = input => {
  const [year, month] = input.split('-'); // Split the input string into year and month
  const date = new Date(year, month - 1); // Create a new Date object. Subtract 1 from month because JavaScript months are 0-indexed.

  // Use toLocaleString to get the month name
  const monthName = date.toLocaleString('default', { month: 'long' });

  return monthName;
}

exports.date = timeStamp =>
  timeStamp
    ? new Date(timeStamp).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'unknown';

// For date and time
exports.dateTime = timeStamp =>
  timeStamp
    ? new Date(timeStamp).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      })
    : 'unknown';

// For Schools
exports.schNum = (id, phoneNum) =>
  id && phoneNum ? `SCH-${id}-${phoneNum}` : 'SCH-ERR-ERR'; // TODO

// For Students
exports.regNum = (id, rollNum) =>
  id && rollNum ? `REG-${id}-${rollNum}` : 'REG-ERR-ERR'; // TODO
