exports.calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100
  const output = ((current - previous) / previous) * 100
  return parseInt(output.toFixed(0))
}

exports.transformAppointmentReport = (inputArray) => {
  const result = []

  inputArray.forEach((item) => {
    item.jobs.forEach((job) => {
      result.push({
        id: item.id,
        on: item.on,
        startTime: item.startTime,
        by: item.by,
        user: {
          firstName: item.user.firstName,
          lastName: item.user.lastName,
        },
        job: {
          service: job.service,
        },
      })
    })
  })

  return result
}
