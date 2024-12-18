exports.getNumberOfMonths = (start, end) => {
  const startYear = start.getUTCFullYear()
  const startMonth = start.getUTCMonth()
  const endYear = end.getUTCFullYear()
  const endMonth = end.getUTCMonth()
  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1 // +1 to include the starting month
}
