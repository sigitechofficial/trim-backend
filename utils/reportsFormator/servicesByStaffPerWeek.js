exports.processServicesReport = ({ employees, servicesList }) => {
  // Create an array of service IDs from servicesList for easy reference
  const serviceIds = servicesList.map((service) => service.id)

  // Process each employee to calculate servicesCount
  const report = employees.map((employee) => {
    // Initialize servicesCount with zeros, aligned to servicesList order
    const servicesCount = new Array(servicesList.length).fill(0)

    // Check if servicesProvided is a valid string
    if (
      employee.servicesProvided &&
      typeof employee.servicesProvided === 'string'
    ) {
      // Split the servicesProvided string into an array of service IDs
      const providedServices = employee.servicesProvided
        .split(',')
        .map((id) => parseInt(id, 10))

      // Create a frequency map of provided services
      const serviceFrequency = providedServices.reduce((acc, serviceId) => {
        acc[serviceId] = (acc[serviceId] || 0) + 1
        return acc
      }, {})

      // Populate servicesCount based on the frequency map and servicesList order
      serviceIds.forEach((serviceId, index) => {
        servicesCount[index] = serviceFrequency[serviceId] || 0
      })
    }

    // Return the employee report object
    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      servicesCount: servicesCount,
    }
  })

  return report
}
