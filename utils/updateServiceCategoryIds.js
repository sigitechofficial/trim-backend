exports.updateServiceCategoryIds = ({
  newCategories,
  oldCategories,
  serviceList,
  salonDetailId,
}) => {
  // Step 1: Create a map from old category ID to category name
  const oldIdToNameMap = {}
  oldCategories.forEach((category) => {
    oldIdToNameMap[category.id] = category.categoryName
  })

  // Step 2: Create a map from category name to new category ID
  const nameToNewIdMap = {}
  newCategories.forEach((category) => {
    nameToNewIdMap[category.categoryName] = category.id
  })

  // Step 3: Update the categoryId in each service
  const updatedServiceList = serviceList.map((service) => {
    const oldCategoryName = oldIdToNameMap[service.categoryId]

    if (!oldCategoryName) {
      console.warn(
        `Service ID ${service.id} has an invalid categoryId ${service.categoryId}. No matching old category found.`,
      )
      return service // Return the service unchanged
    }

    const newCategoryId = nameToNewIdMap[oldCategoryName]

    if (!newCategoryId) {
      console.warn(
        `No new category found for categoryName "${oldCategoryName}". Service ID ${service.id} remains unchanged.`,
      )
      return service // Return the service unchanged
    }
    delete service.id
    return {
      ...service,
      categoryId: newCategoryId,
      salonDetailId: salonDetailId,
    }
  })

  return updatedServiceList
}
