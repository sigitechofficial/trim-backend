const allDaysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

exports.sortAndCompleteTimes = (timesArray) => {
  // Define the order of days for sorting
  const dayOrder = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  }

  // Initialize a map to hold existing days for quick lookup
  const existingDaysMap = new Map()

  // Check if timesArray is a valid array
  if (Array.isArray(timesArray) && timesArray.length > 0) {
    timesArray.forEach((item) => {
      // Normalize day name to match the keys in dayOrder (case-insensitive)
      const dayName = item.day.trim()
      if (dayOrder.hasOwnProperty(dayName)) {
        existingDaysMap.set(dayName, item)
      }
      // If day name is invalid or not in dayOrder, it is ignored
    })
  }

  // Create the complete sorted array
  const completeSortedArray = allDaysOfWeek.map((day) => {
    if (existingDaysMap.has(day)) {
      return existingDaysMap.get(day)
    } else {
      // Add missing day with default values
      return {
        day: day,
        status: false,
        openingTime: '',
        closingTime: '',
      }
    }
  })

  return completeSortedArray
}
