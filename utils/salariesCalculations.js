const daysOfWeek = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
function formatDate(date) {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
  return new Date(date).toLocaleDateString('en-CA', options) // Format: YYYY-MM-DD
}

function getDayOfWeek(date) {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  return days[new Date(date).getDay()]
}
function createEmployeeResponse(employee, dueSalaries) {
  return {
    id: employee?.id || null,
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    image: employee?.image || '',
    totalSalary: dueSalaries
      .reduce((acc, salary) => acc + parseFloat(salary.amount || 0), 0)
      .toFixed(2),
    dueSalaries,
  }
}
//^ Decrement the date by 1

function getPreviousDateFromDate(date, daysAgo = 1) {
  const inputDate = new Date(date) // Convert input to Date object
  inputDate.setDate(inputDate.getDate() - daysAgo) // Subtract the number of days
  return inputDate.getDate() // Return the day of the month
}

//^ Increment the date by 1
//  to avoid issues with time zone differences (specifically UTC offsets) that can cause the date to shift unexpectedly, especially when you're working with new Date() in JavaScript.
function getNextDate(date = new Date()) {
  // Clone the original date to avoid modifying the original
  const adjustedDate = new Date(date)
  // Ensure the time part is set to midday to avoid timezone shift issues
  adjustedDate.setHours(12, 0, 0, 0) // Set to 12:00:00 to avoid day shifts
  return adjustedDate
}

//^ Utility function to create employee response

//^ Function to calculate weekly due salaries

//----------------
//* Calculate Salaries Weekly
//----------------

function calculateWeeklyDueSalaries(amount, lastPaymentDate, today, payDay) {
  console.log(
    '🚀 ~ calculateWeeklyDueSalaries ~ amount, lastPaymentDate, today, payDay:',
    amount,
    lastPaymentDate,
    today,
    payDay,
  )
  console.log('Starting calculateWeeklyDueSalaries...')

  // Parse the input dates
  let prelastPaymentDate = new Date(lastPaymentDate)
  // lastPaymentDate.setDate(lastPaymentDate.getDate() + 1)
  today = new Date(today)
  // date.setUTCHours(0, 0, 0, 0);
  today.setDate(today.getDate() + 1)
  console.log('🚀 ~  ~ today:', today)

  const dueSalaries = []
  const daysInWeek = 7
  // Step 1: Find the first payday (Monday, payDay = 0)
  const currentDay = prelastPaymentDate.getUTCDay()
  // console.log('🚀 ~ calculateWeeklyDueSalaries ~ currentDay:', currentDay)
  let daysUntilNextPayDay = (payDay - currentDay + 7) % 7
  // console.log('🚀 ~  ~ daysUntilNextPayDay:', daysUntilNextPayDay)

  // If the start date is on a Monday (payDay), calculate full salary for next bi-weekly period

  let firstPayDay = lastPaymentDate
  // console.log('🚀 ~  ~ lastPaymentDate:', lastPaymentDate)
  firstPayDay.setUTCDate(firstPayDay.getUTCDate() + daysUntilNextPayDay)
  firstPayDay = getNextDate(firstPayDay)
  // console.log('🚀 ~  ~ firstPayDay:', firstPayDay)

  // Step 1: Calculate partial salary if applicable
  const startOfPartialPeriod = new Date(lastPaymentDate)
  // console.log('🚀 ~  ~ startOfPartialPeriod:', startOfPartialPeriod)
  // startOfPartialPeriod.setDate(startOfPartialPeriod.getDate() + 1) // Start from the next day//?

  // console.log('🚀 ~  ~ firstPayDay:', firstPayDay)
  // Calculate the end of the partial period, which is the first payday
  const endOfPartialPeriod = new Date(firstPayDay)
  // console.log('🚀 ~  ~ endOfPartialPeriod:', endOfPartialPeriod)

  // console.log('🚀 ~  ~ startOfPartialPeriod:', startOfPartialPeriod)
  let nextPayDay = new Date(firstPayDay)

  console.log('🚀 ~  ~ today:', today)
  if (
    startOfPartialPeriod < endOfPartialPeriod &&
    startOfPartialPeriod <= today
    // && startOfPartialPeriod <= today
  ) {
    console.log('🚀 TRUE:')

    console.log('🚀 ~  ~ daysWorked:', daysUntilNextPayDay)
    if (daysUntilNextPayDay > 0) {
      const partialSalary = (amount / daysInWeek) * daysUntilNextPayDay
      dueSalaries.push({
        amount: partialSalary.toFixed(2),
        salaryType: `Partial (${Math.round(daysUntilNextPayDay)} days)`,
        cycle: 'Weekly',
        expectedDate: formatDate(endOfPartialPeriod),
        // expectedDay: getDayOfWeek(endOfPartialPeriod),
      })
    }
  }
  nextPayDay.setDate(nextPayDay.getDate() + daysInWeek)

  // Step 2: Calculate full salaries for each week from the first payday onward
  console.log('🚀 ~ calculateWeeklyDueSalaries ~ today:', today)
  console.log('🚀 ~ calculateWeeklyDueSalaries ~ nextPayDay:', nextPayDay)
  while (nextPayDay <= today) {
    // console.log('🚀 ~ calculateWeeklyDueSalaries ~ nextPayDay:', nextPayDay)
    dueSalaries.push({
      amount: amount.toFixed(2),
      salaryType: 'Complete',
      cycle: 'Weekly',
      expectedDate: formatDate(nextPayDay),
      // expectedDay: getDayOfWeek(nextPayDay),
    })

    // Move to the next Monday
    nextPayDay.setDate(nextPayDay.getDate() + daysInWeek)
    console.log('🚀 ~ calculateWeeklyDueSalaries ~ nextPayDay:', nextPayDay)
  }

  return dueSalaries
}
//----------------
//* Calculate Salaries Monthly
//----------------

function calculateMonthlyDueSalaries(amount, lastPaymentDate, today, payDate) {
  lastPaymentDate = getNextDate(lastPaymentDate) /// for avoiding the issue that when we convert new Date() time in umt is on previous day
  today = new Date(today)
  const dueSalaries = []
  const daysInMonth = 30 // Average month days for salary calculation

  // Handle partial salary for the first month if applicable
  const initialYear = lastPaymentDate.getFullYear()
  const initialMonth = lastPaymentDate.getMonth()

  const nextPayDate = new Date(initialYear, initialMonth + 1, payDate) // Next pay date in the following month
  console.log('🚀 ~ calculateMonthlyDueSalaries ~ nextPayDate:', nextPayDate)
  const endOfMonth = new Date(initialYear, initialMonth + 1, 0) // End of the current month
  console.log('🚀 ~ calculateMonthlyDueSalaries ~ endOfMonth:', endOfMonth)
  console.log('🚀 ~ calculateMonthlyDueSalaries ~ today:', today)

  // Step 1: Calculate and push the partial salary for the days from the last payment date till the end of June
  console.log('🚀 ~ nextPayDate < today:', nextPayDate < today)
  console.log(
    '🚀 ~ lastPaymentDate.getDate() < endOfMonth.getDate():',
    lastPaymentDate.getDate() < endOfMonth.getDate(),
  )
  if (lastPaymentDate.getDate() < endOfMonth.getDate() && nextPayDate < today) {
    const daysWorked = parseInt(
      (endOfMonth - lastPaymentDate) / (1000 * 60 * 60 * 24) + 1,
    )
    const partialSalary = (amount / daysInMonth) * daysWorked

    dueSalaries.push({
      amount: partialSalary.toFixed(2),
      salaryType: `Partial (${daysWorked * 1} days)`,
      cycle: `Monthly`,
      expectedDate: formatDate(nextPayDate), // Expected payment on July 2
      // expectedDay: getDayOfWeek(nextPayDate),
    })
  }

  // Step 2: Move to the next pay date after the partial salary
  let currentPayDate = new Date(
    nextPayDate.getFullYear(),
    nextPayDate.getMonth() + 1,
    payDate,
  ) // August 2

  // Step 3: Loop through full months from the next pay date until today
  while (currentPayDate <= today) {
    dueSalaries.push({
      amount: `${amount}`,
      salaryType: `Complete`,
      cycle: 'Monthly',
      expectedDate: formatDate(currentPayDate), // Full salary from the next month
      // expectedDay: getDayOfWeek(currentPayDate),
    })

    // Move to the next month's pay date
    currentPayDate.setMonth(currentPayDate.getMonth() + 1)
  }

  return dueSalaries
}

//----------------
//* Calculate Salaries Bi-Weekly
//----------------

function calculateBiWeeklyDueSalaries(amount, lastPaymentDate, today, payDay) {
  // Ensure dates are Date objects
  lastPaymentDate = new Date(lastPaymentDate)
  today = new Date(today)
  today.setDate(today.getDate() + 1)

  console.log('🚀 ~ calculateBiWeeklyDueSalaries ~ today:', today)

  const dueSalaries = []
  const daysInBiWeek = 14 // Bi-weekly period is 14 days

  // Step 1: Find the first payday (Monday, payDay = 0)
  const currentDay = lastPaymentDate.getUTCDay()
  let daysUntilNextPayDay = (payDay - currentDay + 7) % 7

  // If the start date is on a Monday (payDay), calculate full salary for next bi-weekly period

  const firstPayDay = new Date(lastPaymentDate)
  firstPayDay.setUTCDate(firstPayDay.getUTCDate() + daysUntilNextPayDay)

  if (lastPaymentDate.getUTCDay() !== payDay) {
    console.log('---------------------------->payDay', payDay)

    // Step 2: Calculate partial salary, but only if days worked is between 8 and 13
    let daysWorkedBeforeFirstPayDay =
      (firstPayDay - lastPaymentDate) / (1000 * 60 * 60 * 24)

    console.log(
      '🚀 ~ calculateBiWeeklyDueSalaries ~ daysWorkedBeforeFirstPayDay:',
      daysWorkedBeforeFirstPayDay,
    )

    if (daysWorkedBeforeFirstPayDay < 8) {
      // If less than 8 days worked, move to the next bi-weekly payday (skip the first)
      firstPayDay.setUTCDate(firstPayDay.getUTCDate() + 7) // Jump to the second next Monday
      daysWorkedBeforeFirstPayDay =
        (firstPayDay - lastPaymentDate) / (1000 * 60 * 60 * 24) // Recalculate
    }
    console.log('🚀 ~ calculateBiWeeklyDueSalaries ~ firstPayDay:', firstPayDay)

    if (
      daysWorkedBeforeFirstPayDay >= 8 &&
      daysWorkedBeforeFirstPayDay <= 13 &&
      firstPayDay <= today // Just to avoid the case when partial salary case runs and first pay date exceed the today
    ) {
      // Calculate the partial salary for 8 to 13 days worked
      const partialSalary =
        (amount / daysInBiWeek) * daysWorkedBeforeFirstPayDay
      dueSalaries.push({
        amount: partialSalary.toFixed(2),
        salaryType: `Partial (${Math.round(daysWorkedBeforeFirstPayDay)} days)`,
        cycle: 'Bi-Weekly',
        expectedDate: formatDate(firstPayDay),
        // expectedDay: getDayOfWeek(firstPayDay),
      })
    }
  }
  // Step 3: Calculate full salaries for all periods after the first payday
  let nextPayDay = new Date(firstPayDay)
  nextPayDay.setUTCDate(nextPayDay.getUTCDate() + daysInBiWeek) // Move to the next bi-weekly payday

  while (nextPayDay <= today) {
    dueSalaries.push({
      amount: `${amount}`,
      salaryType: `Complete (14 days)`,
      cycle: 'Bi-Weekly',
      expectedDate: formatDate(nextPayDay),
      // expectedDay: getDayOfWeek(nextPayDay),
    })

    // Move to the next bi-weekly period
    nextPayDay.setUTCDate(nextPayDay.getUTCDate() + daysInBiWeek)
  }

  return dueSalaries
}
//----------------

//* Calculate Salaries

//----------------

exports.calculateDueSalaries = (employees) => {
  const today = new Date() // Current date
  today.setHours(0, 0, 0, 0) // Reset time part to start of the day

  return employees.map((employee) => {
    const { employeeWagesMethod } = employee || {}
    const amount = parseFloat(employeeWagesMethod?.value || 0)
    const cycle = employeeWagesMethod?.cycle || 'Weekly' // Payment cycle type
    const createdAt = employeeWagesMethod?.createdAt
      ? new Date(employeeWagesMethod.createdAt)
      : null // Creation date
    const payDay = daysOfWeek[employeeWagesMethod?.payDay] || daysOfWeek['sun'] // Pay day is always Sunday (0)

    // Determine last payment date
    let lastPaymentDate = employeeWagesMethod?.prevSalaryDate
      ? new Date(employeeWagesMethod.prevSalaryDate)
      : createdAt || today // Default to today if both are null

    lastPaymentDate.setHours(0, 0, 0, 0) // Reset time part to start of the day

    // If the last payment date is invalid, assume no due salaries
    if (isNaN(lastPaymentDate)) {
      return createEmployeeResponse(employee, [], 0)
    }

    // Calculate due salaries based on the payment cycle
    let dueSalaries = []
    if (cycle === 'Weekly') {
      dueSalaries = calculateWeeklyDueSalaries(
        amount,
        lastPaymentDate,
        today,
        payDay,
      )
    } else if (cycle === 'Bi-weekly') {
      dueSalaries = calculateBiWeeklyDueSalaries(
        amount,
        lastPaymentDate,
        today,
        payDay,
      )
    } else if (cycle === 'Monthly') {
      dueSalaries = calculateMonthlyDueSalaries(
        amount,
        lastPaymentDate,
        today,
        employeeWagesMethod.payDate,
      )
    }

    // Return employee details with the due salaries list
    return createEmployeeResponse(employee, dueSalaries)
  })
}

//*  3. Salaries till date .. required when change wagesmethod  ----------------------------------------

exports.calculateSalaryFromLastDateToToday = (
  amount,
  lastPaymentDate,
  cycle,
) => {
  lastPaymentDate = getNextDate(lastPaymentDate) /// for avoiding the issue that when we convert new Date() time in umt is on previous day
  console.log(
    'ðŸš€ ~ calculateWeeklyDueSalaries ~ lastPaymentDate:',
    lastPaymentDate,
  )
  let cycleDays = 1
  if (cycle === 'Weekly') {
    cycleDays = 7
  } else if (cycle === 'Bi-weekly') {
    cycleDays = 14
  } else if (cycle === 'Monthly') {
    cycleDays = 30
  }
  const today = new Date()

  const dailySalary = amount / cycleDays // Calculate daily salary based on the cycle
  const daysWorked = Math.floor(
    (today - lastPaymentDate) / (1000 * 60 * 60 * 24),
  ) // Calculate days worked

  // Total salary for the period from lastPaymentDate to today
  const totalSalary = dailySalary * daysWorked

  const output = {
    amount: totalSalary.toFixed(2),
    salaryType: `Final pay before wage method change: Partial (${daysWorked} days).`,
    cycle: 'Weekly',
    expectedDate: formatDate(today),
    expectedDay: getDayOfWeek(today),
  }
  return output
}
