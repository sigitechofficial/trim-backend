exports.getAvailableTimeSlots = (
  date,
  openingTime,
  closingTime,
  duration,
  busyTimes,
) => {
  const availableTimeSlots = []

  // Parse date, opening time, and closing time
  const currentDate = new Date(date)
  const openingTimestamp = new Date(`${date} ${openingTime}`).getTime()
  const closingTimestamp = new Date(`${date} ${closingTime}`).getTime()

  // Iterate through time slots
  let currentTimestamp = openingTimestamp
  while (currentTimestamp + duration * 60 * 1000 <= closingTimestamp) {
    const slotStart = new Date(currentTimestamp)
    const slotEnd = new Date(currentTimestamp + duration * 60 * 1000)

    // Check if the slot is not in the busy times
    const isSlotAvailable = busyTimes.every(
      (busyTime) =>
        slotEnd <= new Date(`${date} ${busyTime.startTime}`) ||
        slotStart >= new Date(`${date} ${busyTime.endTime}`),
    )

    if (isSlotAvailable) {
      availableTimeSlots.push({
        start: slotStart.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        end: slotEnd.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    }

    // Move to the next time slot
    currentTimestamp += duration * 60 * 1000
  }

  return availableTimeSlots
}
