exports.getNumberOfWeeks = (start, end) => {
  const msInWeek = 7 * 24 * 60 * 60 * 1000
  const diffInMs = end - start
  return Math.ceil(diffInMs / msInWeek)
}
