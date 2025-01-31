exports.calculateDueRents = (employee) => {
  // Extract the necessary data from the employee object
  const { employeeWagesMethod } = employee
  let { prevSalaryDate, createdAt, cycle, value } = employeeWagesMethod
  // prevSalaryDate = '2025-01-28' // for testing

  // Determine the last payment date and set the time to 00:00:00
  let lastPaymentDate = prevSalaryDate
    ? new Date(prevSalaryDate)
    : new Date(createdAt)

  console.log('🚀 ~ lastPaymentDate: BEFORE', lastPaymentDate)
  // Reset the time to 00:00:00 for consistency
  // lastPaymentDate.setHours(0, 0, 0, 0)
  // console.log('🚀 ~ lastPaymentDate: AFTER', lastPaymentDate)

  // Get today's date and reset its time to 00:00:00 as well
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate the difference in days between the last payment date and today
  const diffTime = today - lastPaymentDate
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) // Convert milliseconds to days

  // Calculate the rent due and number of cycles based on the cycle
  let rentDue = 0
  let numberCycle = 0
  let paymentTillDate = new Date(lastPaymentDate) // Initialize with last payment date

  if (cycle === 'Monthly') {
    // Monthly cycle: 30 days per month
    numberCycle = Math.floor(diffDays / 30)
    rentDue = numberCycle * parseFloat(value)
    // Calculate the last date of the last cycle
    paymentTillDate.setDate(paymentTillDate.getDate() + numberCycle * 30)
  } else if (cycle === 'Weekly') {
    // Weekly cycle: 7 days per week
    numberCycle = Math.floor(diffDays / 7)
    rentDue = numberCycle * parseFloat(value)
    // Calculate the last date of the last cycle
    paymentTillDate.setDate(paymentTillDate.getDate() + numberCycle * 7)
  } else if (cycle === 'Daily') {
    // Daily cycle: 1 day per rent cycle
    numberCycle = diffDays
    rentDue = numberCycle * parseFloat(value)
    // Calculate the last date of the last cycle
    paymentTillDate.setDate(paymentTillDate.getDate() + numberCycle)
  } else if (cycle === 'Bi-weekly') {
    // Bi-weekly cycle: 14 days per cycle
    numberCycle = Math.floor(diffDays / 14)
    rentDue = numberCycle * parseFloat(value)
    // Calculate the last date of the last cycle
    paymentTillDate.setDate(paymentTillDate.getDate() + numberCycle * 14)
  }

  // Return the calculated rent dues, number of cycles, cycle type, and payment till date
  return {
    rentDue,
    numberCycle,
    cycle,
    paymentTillDate: paymentTillDate.toISOString(), // Returning in ISO string format
  }
}
