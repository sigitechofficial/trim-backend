const { tip } = require('../models')

exports.distributeTip = (appointment, extraTip = 0, at = 'checkout') => {
  // Parse appointment total and tip to float
  const appointmentTotal = parseFloat(appointment.total)
  const appointmentTip = parseFloat(appointment.tip) + parseFloat(extraTip)

  // Validate appointment total and tip
  if (isNaN(appointmentTotal) || appointmentTotal < 0) {
    throw new Error('Invalid appointment total.')
  }
  if (isNaN(appointmentTip) || appointmentTip < 0) {
    throw new Error('Invalid appointment tip.')
  }

  // If there's no tip, set all completed jobs' tips to "0.00"
  if (appointmentTip < 1) {
    return appointment.jobs
      .filter((job) => job.status.toLowerCase() === 'complete')
      .map((job) => ({
        ...job,
        tip: '0.00',
      }))
  }

  // Filter jobs with status "complete"
  const completedJobs = appointment.jobs.filter(
    (job) => job.status.toLowerCase() === 'complete',
  )

  // If no completed jobs, return an empty array
  if (completedJobs.length === 0) {
    return []
  }

  // Calculate sum of completed jobs' totals in cents to avoid floating point issues
  const completedJobsWithTotals = completedJobs.map((job) => ({
    ...job,
    totalCents: Math.round(parseFloat(job.total) * 100),
  }))

  const sumCompletedJobsTotalCents = completedJobsWithTotals.reduce(
    (sum, job) => sum + job.totalCents,
    0,
  )

  // Handle edge case where sum of completed jobs' totals is zero
  if (sumCompletedJobsTotalCents === 0) {
    throw new Error(
      "Sum of completed jobs' totals is zero. Cannot distribute tip.",
    )
  }

  // Convert appointment tip to cents
  const appointmentTipCents = Math.round(appointmentTip * 100)

  // Calculate each completed job's proportion and initial tip allocation
  let distributedTipCents = 0
  const completedJobsWithTip = completedJobsWithTotals.map((job) => {
    const proportion = job.totalCents / sumCompletedJobsTotalCents
    const exactTipCents = proportion * appointmentTipCents
    const tipCents = Math.floor(exactTipCents)
    distributedTipCents += tipCents
    return {
      ...job,
      tipCents,
      // Store fractional part for accurate rounding
      fractional: exactTipCents - tipCents,
    }
  })

  // Calculate any remaining cents due to flooring
  let remainingCents = appointmentTipCents - distributedTipCents

  if (remainingCents > 0) {
    // Sort completed jobs by the highest fractional part
    completedJobsWithTip.sort((a, b) => b.fractional - a.fractional)

    // Distribute the remaining cents to the jobs with the highest fractions
    for (let i = 0; i < remainingCents; i++) {
      completedJobsWithTip[i].tipCents += 1
    }
  }

  // Prepare the final completed jobs array with updated tips
  const updatedCompletedJobs = completedJobsWithTip.map((job) => ({
    amount: (job.tipCents / 100).toFixed(2),
    jobId: job.id,
    bookingId: appointment.id,
    at: at,
    employeeId: job.employeeId,

    // Optionally, remove temporary properties
    tipCents: undefined,
    fractional: undefined,
    totalCents: undefined,
  }))

  // Return only the updated completed jobs
  tip.bulkCreate(updatedCompletedJobs)
  return updatedCompletedJobs
}
