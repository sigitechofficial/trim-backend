const { employee } = require('../models')
exports.employeeForSocket = async (salonDetailId) => {
  if (!salonDetailId) return []
  const data = await employee.findAll({
    where: { salonDetailId: salonDetailId },
    attributes: ['id', 'position'],
  })
  const workers = []
  if (data.length > 0) {
    data.forEach((ele) => {
      workers.push(ele.id)
    })
  }
  return workers
}
