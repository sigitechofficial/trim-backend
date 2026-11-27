exports.calculateDueRents = (employee) => {
  // Extract the necessary data from the employee object
  const { employeeWagesMethod } = employee
  const { prevSalaryDate, createdAt, cycle, value } = employeeWagesMethod //initialPayment will use if needed

  // Determine the last payment date and set the time to 00:00:00
  let lastPaymentDate = prevSalaryDate
    ? new Date(prevSalaryDate)
    : new Date(createdAt)

  // Reset the time to 00:00:00 for consistency
  lastPaymentDate.setHours(0, 0, 0, 0)

  // Get today's date and reset its time to 00:00:00 as well
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate the difference in days, ensuring it is never negative
  let diffDays = Math.floor((today - lastPaymentDate) / (1000 * 60 * 60 * 24))
  diffDays = Math.max(diffDays, 0) // Ensure it's never negative

  // Calculate the rent due and number of cycles based on the cycle
  let rentDue = 0
  let numberCycle = 0
  let paymentTillDate = new Date(lastPaymentDate) // Initialize with last payment date

  if (cycle === 'Monthly') {
    numberCycle = Math.floor(diffDays / 30)
    rentDue = numberCycle * parseFloat(value)
    paymentTillDate.setDate(paymentTillDate.getDate() + numberCycle * 30)
  } else if (cycle === 'Weekly') {
    numberCycle = Math.floor(diffDays / 7)
    rentDue = numberCycle * parseFloat(value)
    paymentTillDate.setDate(paymentTillDate.getDate() + numberCycle * 7)
  } else if (cycle === 'Daily') {
    numberCycle = diffDays
    rentDue = numberCycle * parseFloat(value)
    paymentTillDate.setDate(paymentTillDate.getDate() + numberCycle)
  } else if (cycle === 'Bi-weekly') {
    numberCycle = Math.floor(diffDays / 14)
    rentDue = numberCycle * parseFloat(value)
    paymentTillDate.setDate(paymentTillDate.getDate() + numberCycle * 14)
  }

  // Ensure no negative cycles
  numberCycle = Math.max(numberCycle, 0)
  rentDue = Math.max(rentDue, 0)

  // Add initial payment to the rent due (if provided)
  // rentDue += initialPayment ? parseFloat(initialPayment) : 0

  // Return the calculated rent dues, number of cycles, cycle type, payment till date, and initial payment
  return {
    rentDue,
    numberCycle,
    // The business app reads this name for "Un-paid cycle" (and sends it back
    // when rent is recorded); without it the screen always showed 0.
    numberOfCycle: numberCycle,
    cycle,
    rentPerCycle: value,
    paymentTillDate: paymentTillDate.toISOString(), // Returning in ISO format
    // initialPayment: initialPayment || 0,
  }
}
