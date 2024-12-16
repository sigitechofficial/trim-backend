exports.busiestQuietestDays = (input, startDate) => {
  const report = {
    Sunday: { currentWeek: 0, previousWeek: 0, averagePerWeek: 0 },
    Monday: { currentWeek: 0, previousWeek: 0, averagePerWeek: 0 },
    Tuesday: { currentWeek: 0, previousWeek: 0, averagePerWeek: 0 },
    Wednesday: { currentWeek: 0, previousWeek: 0, averagePerWeek: 0 },
    Thursday: { currentWeek: 0, previousWeek: 0, averagePerWeek: 0 },
    Friday: { currentWeek: 0, previousWeek: 0, averagePerWeek: 0 },
    Saturday: { currentWeek: 0, previousWeek: 0, averagePerWeek: 0 },
  }

  // Helper function to parse dates
  function parseDate(dateStr) {
    const d = new Date(dateStr)
    if (isNaN(d)) {
      console.error(`Invalid date format: ${dateStr}`)
      return NaN
    }
    return d
  }

  const start = parseDate(startDate)
  if (isNaN(start)) {
    console.error(
      "Invalid startDate. Please provide a valid date in 'YYYY-MM-DD' format.",
    )
    return report
  }

  // Calculate the boundaries for previous and current weeks
  const previousWeekEnd = new Date(start)
  previousWeekEnd.setDate(start.getDate() + 6) // Previous week: startDate to +6 days

  const currentWeekStart = new Date(previousWeekEnd)
  currentWeekStart.setDate(previousWeekEnd.getDate() + 1) // Current week starts the day after previousWeekEnd

  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6) // Current week: +6 days after currentWeekStart

  console.log(
    'Previous Week:',
    start.toISOString(),
    '-',
    previousWeekEnd.toISOString(),
  )
  console.log(
    'Current Week:',
    currentWeekStart.toISOString(),
    '-',
    currentWeekEnd.toISOString(),
  )

  // Process each service record
  input.forEach((record) => {
    const recordDate = parseDate(record.on)
    if (isNaN(recordDate)) {
      console.error(`Invalid service date in record: ${record.on}`)
      return
    }

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]
    const dayName = dayNames[recordDate.getDay()]

    if (!report.hasOwnProperty(dayName)) {
      return // Ignore non-Monday to Friday dates
    }

    console.log(
      `Processing record ID ${record.id}, Date: ${recordDate.toISOString()}, Day: ${dayName}`,
    )

    // Use inclusive comparison for both weeks
    if (recordDate >= start && recordDate <= previousWeekEnd) {
      console.log('-> Incrementing Previous Week')
      report[dayName].previousWeek += record.serviceCount
    } else if (recordDate >= currentWeekStart && recordDate <= currentWeekEnd) {
      console.log('-> Incrementing Current Week')
      report[dayName].currentWeek += record.serviceCount
    } else {
      console.log('-> Record does not fall into any week.')
    }
  })

  // Calculate average per week for each day
  Object.keys(report).forEach((day) => {
    const { currentWeek, previousWeek } = report[day]
    report[day].averagePerWeek = (currentWeek + previousWeek) / 2
  })

  return report
}

exports.busiestQuietestHours = (input, startDate) => {
  // Initialize report structure for 24-hour slots
  const report = {}
  for (let hour = 0; hour < 24; hour++) {
    const startHour = hour.toString().padStart(2, '0') + ':00'
    const endHour = (hour + 1).toString().padStart(2, '0') + ':00'
    report[`${startHour} - ${endHour}`] = {
      currentWeek: 0,
      previousWeek: 0,
      averagePerWeek: 0,
    }
  }

  // Helper function to parse dates
  function parseDate(dateStr) {
    const d = new Date(dateStr)
    if (isNaN(d)) {
      console.error(`Invalid date format: ${dateStr}`)
      return NaN
    }
    return d
  }

  // Helper function to compare time strings (HH:MM)
  function isTimeInRange(time, rangeStart, rangeEnd) {
    return time >= rangeStart && time < rangeEnd
  }

  const start = parseDate(startDate)
  if (isNaN(start)) {
    console.error(
      "Invalid startDate. Please provide a valid date in 'YYYY-MM-DD' format.",
    )
    return report
  }

  // Calculate the boundaries for previous and current weeks
  const previousWeekEnd = new Date(start)
  previousWeekEnd.setDate(start.getDate() + 6) // Previous week: startDate to +6 days

  const currentWeekStart = new Date(previousWeekEnd)
  currentWeekStart.setDate(previousWeekEnd.getDate() + 1) // Current week starts the day after previousWeekEnd

  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6) // Current week: +6 days after currentWeekStart

  console.log(
    'Previous Week:',
    start.toISOString(),
    '-',
    previousWeekEnd.toISOString(),
  )
  console.log(
    'Current Week:',
    currentWeekStart.toISOString(),
    '-',
    currentWeekEnd.toISOString(),
  )

  // Process each service record
  input.forEach((record) => {
    const recordDate = parseDate(record.on)
    if (isNaN(recordDate)) {
      console.error(`Invalid service date in record: ${record.on}`)
      return
    }

    const recordTime = record.startTime

    console.log(
      `Processing record ID ${record.id}, Date: ${recordDate.toISOString()}, Time: ${recordTime}`,
    )

    // Determine whether the record is in the previous or current week
    let weekColumn
    if (recordDate >= start && recordDate <= previousWeekEnd) {
      weekColumn = 'previousWeek'
    } else if (recordDate >= currentWeekStart && recordDate <= currentWeekEnd) {
      weekColumn = 'currentWeek'
    } else {
      console.log('-> Record does not fall into any week.')
      return
    }

    // Check which hourly range the time falls into
    for (let hour = 0; hour < 24; hour++) {
      const startHour = hour.toString().padStart(2, '0') + ':00'
      const endHour = (hour + 1).toString().padStart(2, '0') + ':00'

      if (isTimeInRange(recordTime, startHour, endHour)) {
        console.log(
          `-> Incrementing ${weekColumn} for ${startHour} - ${endHour}`,
        )
        report[`${startHour} - ${endHour}`][weekColumn] += record.serviceCount
        break
      }
    }
  })

  // Calculate the average-per-week for each time slot
  for (const timeSlot in report) {
    const { currentWeek, previousWeek } = report[timeSlot]
    report[timeSlot].averagePerWeek = (currentWeek + previousWeek) / 2
  }

  return report
}
