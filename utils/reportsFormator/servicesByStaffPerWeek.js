exports.processServicesReport = ({ report, servicesList }) => {
  // Initialize a new array to hold the result
  const processedReport = []

  // Create a map of service ids to their names from servicesList
  const servicesMap = servicesList.reduce((map, service) => {
    map[service.id] = service.serviceName
    return map
  }, {})

  // Loop through the report array
  report.forEach((person) => {
    // Start by creating a new object for the person
    let personReport = {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
    }

    // If servicesProvided is not null, process it
    if (person.servicesProvided !== null) {
      // Split the servicesProvided string into an array of counts
      const servicesCountArray = person.servicesProvided.split(',')

      // Initialize an object to store the service counts
      const servicesCount = {}

      // Loop through the servicesList and match the count to each service by id
      servicesList.forEach((service, index) => {
        // If the current service exists in servicesCountArray, assign the count
        if (index < servicesCountArray.length) {
          servicesCount[service.serviceName] = parseInt(
            servicesCountArray[index],
            10,
          )
        } else {
          // Otherwise, assign 0 to the service
          servicesCount[service.serviceName] = 0
        }
      })

      // Add the service counts to the personReport object
      personReport.servicesCount = servicesCount
    } else {
      // If servicesProvided is null, assign zero to all services
      const servicesCount = {}
      servicesList.forEach((service) => {
        servicesCount[service.serviceName] = 0
      })
      personReport.servicesCount = servicesCount
    }

    // Add the processed person to the result array
    processedReport.push(personReport)
  })

  return processedReport
}
