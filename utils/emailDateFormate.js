exports.emailDateFormate = (dateString, timeString) => {
  console.log("🚀 ~ dateString, timeString:", dateString, timeString)
  // Convert the date and time strings to Date objects
  const [customYear, customMonth, customDay] = dateString.split('-').map(Number);
    
    // Create a new date object using the components
    const date = new Date(customYear, customMonth - 1, customDay);
  const time = new Date(`1970-01-01T${timeString}`);
  
  // Get the day of the week and month names
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Get the day of the week, month, and year
  const dayOfWeek = daysOfWeek[date.getDay()];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  // Get the day of the month, hour, and minute
  const dayOfMonth = date.getDate();
  const hour = time.getHours() % 12 || 12; // Convert 0 to 12 for AM/PM format
  const minute = time.getMinutes();
  
  // Determine AM or PM
  const ampm = time.getHours() < 12 ? 'am' : 'pm';
  
  // Construct the formatted string
  const formattedString = `${dayOfWeek}, ${dayOfMonth} ${month} ${year} at ${hour}:${minute.toString().padStart(2, '0')}${ampm}`;
  
  return formattedString;
}

 
