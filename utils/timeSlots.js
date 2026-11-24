exports.getAvailableTimeSlots = (
  date,
  openingTime,
  closingTime,
  duration,
  busyTimes,
) => {
  if (!duration || duration === 0) duration = 60
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

/**
 * One slot starting exactly at startAt ('HH:mm[:ss]'), if it fits the working
 * hours and no busy time; null otherwise. Same time format as the slot list.
 * Used to add a service straight after a booking's last service.
 */
exports.slotAt = (date, openingTime, closingTime, duration, busyTimes, startAt) => {
  if (!duration || duration === 0) duration = 60
  const hhmm = String(startAt || '').slice(0, 8)
  if (!/^\d{2}:\d{2}/.test(hhmm)) return null
  const slotStart = new Date(`${date} ${hhmm.length === 5 ? hhmm + ':00' : hhmm}`)
  const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000)
  if (Number.isNaN(slotStart.getTime())) return null
  if (slotStart < new Date(`${date} ${openingTime}`) || slotEnd > new Date(`${date} ${closingTime}`)) return null
  const free = busyTimes.every(
    (busyTime) => slotEnd <= new Date(`${date} ${busyTime.startTime}`) || slotStart >= new Date(`${date} ${busyTime.endTime}`),
  )
  if (!free) return null
  const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return { start: fmt(slotStart), end: fmt(slotEnd) }
}
