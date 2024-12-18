exports.getDayOccurrences = (start, end) => {
  const occurrences = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    Sunday: 0,
  }

  const current = new Date(start)

  while (current <= end) {
    const dayNumber = current.getUTCDay() // 0 (Sunday) to 6 (Saturday)
    let dayName = ''

    switch (dayNumber) {
      case 0:
        dayName = 'Sunday'
        break
      case 1:
        dayName = 'Monday'
        break
      case 2:
        dayName = 'Tuesday'
        break
      case 3:
        dayName = 'Wednesday'
        break
      case 4:
        dayName = 'Thursday'
        break
      case 5:
        dayName = 'Friday'
        break
      case 6:
        dayName = 'Saturday'
        break
      default:
        dayName = ''
    }

    if (dayName) {
      occurrences[dayName] += 1
    }

    // Move to the next day
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return occurrences
}
