exports.convertTo24HourFormat = (time12Hour) => {
  // Split the input time into hours, minutes, and period (AM/PM)
  const [time, period] = time12Hour.split(' ')
  let [hours, minutes] = time.split(':').map(Number)

  // Convert to 24-hour format
  if (period === 'AM') {
    if (hours === 12) {
      hours = 0 // Midnight case
    }
  } else if (period === 'PM') {
    if (hours !== 12) {
      hours += 12
    }
  }

  // Format hours and minutes to always be two digits
  const hours24 = String(hours).padStart(2, '0')
  const minutes24 = String(minutes).padStart(2, '0')

  return `${hours24}:${minutes24}`
}

exports.convertTo12HourFormat = (time24) => {
  // Split the input time into hours and minutes
  const [hours, minutes] = time24.split(':').map(Number)

  // Special case for 24:00
  if (hours === 24 && minutes === 0) {
    return '12:00 AM'
  }

  // Determine if it's AM or PM
  const period = hours < 12 ? 'AM' : 'PM'

  // Convert hours to 12-hour format
  const hours12 = hours % 12 || 12

  // Format the minutes with leading zeros if needed
  const formattedMinutes = String(minutes).padStart(2, '0')

  // Construct the 12-hour format time string
  const time12 = `${hours12}:${formattedMinutes} ${period}`

  return time12
}

exports.dayOnDate = (date) => {
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  const dayIndex = date.getDay()
  return daysOfWeek[dayIndex]
}

exports.TwoMonthStartEndDate = () => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Last date of the current month
  const lastDateOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0)

  // Start date of the previous month
  const startDateOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1)

  return {
    lastDateOfCurrentMonth: lastDateOfCurrentMonth
      .toISOString()
      .substring(0, 10),
    startDateOfPreviousMonth: startDateOfPreviousMonth
      .toISOString()
      .substring(0, 10),
  }
}

exports.stampToDate = (timestamp) => {
  const date = new Date(timestamp * 1000)

  // Get the year, month, and day
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  const formattedDate = year + '-' + month + '-' + day
  return formattedDate
}

exports.daysBetween = (startDate, endDate) => {
  // Parse the input dates
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Calculate the difference in milliseconds
  const differenceInMillis = end - start

  // Convert milliseconds to days
  const differenceInDays = differenceInMillis / (1000 * 60 * 60 * 24)

  return differenceInDays
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

exports.getPreviousDates = (startDate, endDate) => {
  // Parse the input dates
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Calculate the difference in days between endDate and startDate
  const differenceInDays = Math.floor((end - start) / (1000 * 60 * 60 * 24))
  console.log('🚀 ~ differenceInDays:', differenceInDays)

  // Subtract differenceInDays days from each date
  start.setDate(start.getDate() - differenceInDays - 1)
  end.setDate(end.getDate() - differenceInDays - 1)

  // Format the dates as 'YYYY-MM-DD' strings
  const prevStartDate = formatDate(start)
  const prevEndDate = formatDate(end)

  return { prevStartDate, prevEndDate }
}

exports.calculateMinutes = (openingTime, closingTime, status) => {
  if (!status) {
    return 0
  }
  if (openingTime == '00:00:01' && closingTime == '24:00:00') {
    return 1440
  }

  // Parse the times as Date objects
  const openingDate = new Date(`1970-01-01T${openingTime}Z`)
  const closingDate = new Date(`1970-01-01T${closingTime}Z`)

  // Calculate the difference in milliseconds
  const differenceInMilliseconds = closingDate - openingDate

  // Convert the difference from milliseconds to minutes
  const differenceInMinutes = differenceInMilliseconds / (1000 * 60)

  return differenceInMinutes
}
