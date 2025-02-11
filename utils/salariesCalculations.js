const { tip } = require('../models')
const { literal, Op } = require('sequelize')
const daysOfWeek = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

function formatDate(date) {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
  return new Date(date).toLocaleDateString('en-CA', options) // Format: YYYY-MM-DD
}

function addTwoNumbers(numStr1, numStr2) {
  // Convert the string inputs to floating-point numbers
  const num1 = parseFloat(numStr1)
  const num2 = parseFloat(numStr2)

  // Calculate the sum
  const sum = num1 + num2

  // Return the sum as a string with exactly two digits after the decimal point
  return sum.toFixed(2)
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
      .reduce((acc, salary) => acc + parseFloat(salary.totalTransfer || 0), 0)
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

async function calculateWeeklyDueSalaries(
  amount,
  lastPaymentDate,
  today,
  payDay,
) {
  console.log('Starting calculateWeeklyDueSalaries...')

  // Parse input dates
  const startDate = new Date(lastPaymentDate)
  today = new Date(today)
  // (Optional) Adjust today if needed – for example, if you want to include the current day:
  today.setDate(today.getDate() + 1)

  const dueSalaries = []
  const daysInWeek = 7

  // -------------------------------
  // 1. Determine the first payday.
  // -------------------------------
  const currentDay = startDate.getUTCDay()
  const daysUntilNextPayDay = (payDay - currentDay + 7) % 7
  let firstPayDay = new Date(lastPaymentDate)
  firstPayDay.setUTCDate(firstPayDay.getUTCDate() + daysUntilNextPayDay)
  // Adjust if you need the next day after that date
  firstPayDay = getNextDate(firstPayDay)

  // ------------------------------------------
  // 2. Calculate the partial cycle (if needed)
  // Period: from lastPaymentDate to firstPayDay.
  // ------------------------------------------
  const partialCycleStart = new Date(lastPaymentDate)
  const partialCycleEnd = new Date(firstPayDay)

  if (partialCycleStart < partialCycleEnd && partialCycleStart <= today) {
    if (daysUntilNextPayDay > 0) {
      // Calculate salary for the partial period
      const partialSalary = (amount / daysInWeek) * daysUntilNextPayDay

      // Query the total tips for this partial period using Sequelize.
      const partialTips = await tip.sum('amount', {
        where: {
          on: {
            [Op.between]: [partialCycleStart, partialCycleEnd],
          },
        },
      })

      dueSalaries.push({
        amount: partialSalary.toFixed(2),
        tips: partialTips ? partialTips.toFixed(2) : '0.00',
        totalTransfer: addTwoNumbers(
          partialSalary || '0.00',
          partialTips || '0.00',
        ),
        salaryType: `Partial (${Math.round(daysUntilNextPayDay)} days)`,
        cycle: 'Weekly',
        expectedDate: formatDate(partialCycleEnd),
      })
    }
  }

  // -------------------------------------------------------
  // 3. Calculate full weekly cycles starting from firstPayDay.
  // Each full cycle is defined as one week:
  //   cycleStart: previous payday (or firstPayDay for the first full cycle)
  //   cycleEnd: cycleStart + 7 days.
  // -------------------------------------------------------
  let fullCycleStart = new Date(firstPayDay)
  let fullCycleEnd = new Date(fullCycleStart)
  fullCycleEnd.setDate(fullCycleEnd.getDate() + daysInWeek)

  // Process full cycles as long as the cycle end is on or before today.
  while (fullCycleEnd <= today) {
    // For each full cycle, the complete weekly salary is paid.
    const fullSalary = amount

    // Query total tips for the full cycle period.
    const fullCycleTips = await tip.sum('amount', {
      where: {
        on: {
          [Op.between]: [fullCycleStart, fullCycleEnd],
        },
      },
    })

    dueSalaries.push({
      amount: fullSalary.toFixed(2),
      tips: fullCycleTips ? fullCycleTips.toFixed(2) : '0.00',
      totalTransfer: addTwoNumbers(
        fullSalary || '0.00',
        fullCycleTips || '0.00',
      ),
      salaryType: 'Complete',
      cycle: 'Weekly',
      expectedDate: formatDate(fullCycleEnd),
    })

    // Move to the next week cycle.
    fullCycleStart = new Date(fullCycleEnd)
    fullCycleEnd = new Date(fullCycleStart)
    fullCycleEnd.setDate(fullCycleEnd.getDate() + daysInWeek)
  }

  return dueSalaries
}

//----------------
//* Calculate Salaries Monthly
//----------------

async function calculateMonthlyDueSalaries(
  amount,
  lastPaymentDate,
  today,
  payDate,
) {
  // Do not disturb existing functionality:
  lastPaymentDate = getNextDate(lastPaymentDate) /// for avoiding the issue that when we convert new Date() time in UTC is on previous day
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

  // Step 1: Calculate and push the partial salary for the days from the last payment date till the end of the current month
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

    // Query tips for the partial period (from lastPaymentDate to endOfMonth)
    const partialTips = await tip.sum('amount', {
      where: {
        on: {
          [Op.between]: [lastPaymentDate, endOfMonth],
        },
      },
    })

    dueSalaries.push({
      amount: partialSalary.toFixed(2),
      tips: partialTips ? partialTips.toFixed(2) : '0.00',
      totalTransfer: addTwoNumbers(
        partialTips || '0.00',
        partialSalary || '0.00',
      ),
      salaryType: `Partial (${daysWorked} days)`,
      cycle: `Monthly`,
      expectedDate: formatDate(nextPayDate), // Expected payment on nextPayDate
    })
  }

  // Step 2: Move to the next pay date after the partial salary
  let currentPayDate = new Date(
    nextPayDate.getFullYear(),
    nextPayDate.getMonth() + 1,
    payDate,
  ) // For example, if nextPayDate was July 2, then currentPayDate is August 2

  // For full monthly cycles, we set the cycleStart date as the first pay date (i.e., nextPayDate)
  let cycleStart = new Date(nextPayDate)

  // Step 3: Loop through full months from the next pay date until today
  while (currentPayDate <= today) {
    // Query tips for this full cycle (from cycleStart to currentPayDate)
    const fullCycleTips = await tip.sum('amount', {
      where: {
        on: {
          [Op.between]: [cycleStart, currentPayDate],
        },
      },
    })

    dueSalaries.push({
      amount: `${amount}`,
      tips: fullCycleTips ? fullCycleTips.toFixed(2) : '0.00',
      totalTransfer: addTwoNumbers(amount || '0.00', partialSalary || '0.00'),
      salaryType: `Complete`,
      cycle: 'Monthly',
      expectedDate: formatDate(currentPayDate),
    })

    // Prepare for the next cycle:
    // The next cycle starts at the current pay date.
    cycleStart = new Date(currentPayDate)
    // And move to the next month's pay date.
    currentPayDate.setMonth(currentPayDate.getMonth() + 1)
  }

  return dueSalaries
}

//----------------
//* Calculate Salaries Bi-Weekly
//----------------

async function calculateBiWeeklyDueSalaries(
  amount,
  lastPaymentDate,
  today,
  payDay,
) {
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
      firstPayDay <= today // Just to avoid the case when partial salary runs and first pay date exceeds today
    ) {
      // Calculate the partial salary for 8 to 13 days worked
      const partialSalary =
        (amount / daysInBiWeek) * daysWorkedBeforeFirstPayDay

      // Query tips for the partial period (from lastPaymentDate to firstPayDay)
      const partialTips = await tip.sum('amount', {
        where: {
          on: {
            [Op.between]: [lastPaymentDate, firstPayDay],
          },
        },
      })

      dueSalaries.push({
        amount: partialSalary.toFixed(2),
        tips: partialTips ? partialTips.toFixed(2) : '0.00',
        totalTransfer: addTwoNumbers(
          partialSalary || '0.00',
          partialTips || '0.00',
        ),
        salaryType: `Partial (${Math.round(daysWorkedBeforeFirstPayDay)} days)`,
        cycle: 'Bi-Weekly',
        expectedDate: formatDate(firstPayDay),
        // expectedDay: getDayOfWeek(firstPayDay),
      })
    }
  }

  // Step 3: Calculate full salaries for all periods after the first payday
  // We'll track the start of each cycle for tip calculation.
  let cycleStart = new Date(firstPayDay)
  let nextPayDay = new Date(firstPayDay)
  nextPayDay.setUTCDate(nextPayDay.getUTCDate() + daysInBiWeek) // Move to the next bi-weekly payday

  while (nextPayDay <= today) {
    // Query tips for the full cycle period (from cycleStart to nextPayDay)
    const fullCycleTips = await tip.sum('amount', {
      where: {
        on: {
          [Op.between]: [cycleStart, nextPayDay],
        },
      },
    })

    dueSalaries.push({
      amount: `${amount}`,
      tips: fullCycleTips ? fullCycleTips.toFixed(2) : '0.00',
      totalTransfer: addTwoNumbers(amount || '0.00', fullCycleTips || '0.00'),
      salaryType: `Complete (14 days)`,
      cycle: 'Bi-Weekly',
      expectedDate: formatDate(nextPayDay),
      // expectedDay: getDayOfWeek(nextPayDay),
    })

    // Move to the next bi-weekly period and update cycleStart for the next cycle
    cycleStart = new Date(nextPayDay)
    nextPayDay.setUTCDate(nextPayDay.getUTCDate() + daysInBiWeek)
  }

  return dueSalaries
}

//----------------

//* Calculate Salaries

//----------------

exports.calculateDueSalaries = async (employees) => {
  const today = new Date() // Current date
  today.setHours(0, 0, 0, 0) // Reset time part to start of the day

  // Use Promise.all to await asynchronous operations in the map callback
  const responses = await Promise.all(
    employees.map(async (employee) => {
      const { employeeWagesMethod } = employee || {}
      const amount = parseFloat(employeeWagesMethod?.value || 0)
      const cycle = employeeWagesMethod?.cycle || 'Weekly' // Payment cycle type
      const createdAt = employeeWagesMethod?.createdAt
        ? new Date(employeeWagesMethod.createdAt)
        : null // Creation date
      const payDay =
        daysOfWeek[employeeWagesMethod?.payDay] || daysOfWeek['sun'] // Pay day is always Sunday (0)

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
        dueSalaries = await calculateWeeklyDueSalaries(
          amount,
          lastPaymentDate,
          today,
          payDay,
        )
      } else if (cycle === 'Bi-weekly') {
        dueSalaries = await calculateBiWeeklyDueSalaries(
          amount,
          lastPaymentDate,
          today,
          payDay,
        )
      } else if (cycle === 'Monthly') {
        dueSalaries = await calculateMonthlyDueSalaries(
          amount,
          lastPaymentDate,
          today,
          employeeWagesMethod.payDate,
        )
      }

      // Return employee details with the due salaries list
      return createEmployeeResponse(employee, dueSalaries)
    }),
  )

  return responses
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
    cycle: cycle,
    expectedDate: formatDate(today),
    expectedDay: getDayOfWeek(today),
  }
  return output
}
