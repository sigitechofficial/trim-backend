const { Op } = require('sequelize')
const { Model } = require('sequelize')
const appError = require('./../utils/appError')

exports.deleteOne = (Model) => async (req, res, next) => {
  const result = await Model.destroy({
    where: { id: req.body.id },
  })

  if (!result) {
    return next(new appError('No record found with that ID', 404))
  }

  res.status(200).json({
    status: '1',
    message: 'Deleted Successfully!',
    data: null,
    error: '',
  })
}

exports.updateOne = (Model) => async (req, res, next) => {
  const data = await Model.update(req.body, {
    where: { id: req.body.id },
    returning: true,
  })

  if (!data) {
    return next(new appError('No record found with that ID', 404))
  }

  res.status(200).json({
    status: '1',
    message: 'Updated Successfully!',
    data,
    error: '',
  })
}

exports.createOne = (Model) => async (req, res, next) => {
  console.log('🚀 ~ exports.createOne= ~ req.body:', req.body)
  const data = await Model.create(req.body)

  res.status(200).json({
    status: '1',
    message: 'Created Successfully!',
    data,
    error: '',
  })
}

exports.getOne = (Model, option) => async (req, res, next) => {
  let data
  if (option) {
    data = Model.findByPk(req.body.id, option)
  } else {
    data = Model.findByPk(req.body.id, option)
  }
  if (!data) {
    return next(new appError('No record found with that ID', 404))
  }

  res.status(200).json({
    status: '1',
    message: '',
    data,
    error: '',
  })
}
//! Option is an Object
/**
 * 
 const option = {
    where: {
      customerId: userId,
    },
    order: [["id", "DESC"]],
    include: [
      { model: bookingStatus, attributes: ["title"] }
    ],
    attributes: ["id", firstName,],
  }
 */
exports.getAll = (Model, option) => async (req, res, next) => {
  let data
  if (option) {
    data = await Model.findAll(option)
  } else {
    data = await Model.findAll()
  }
  if (data.length < 1) {
    return next(new appError('No record found', 404))
  }
  res.status(200).json({
    status: '1',
    message: `All Data`,
    data,
    error: '',
  })
}
