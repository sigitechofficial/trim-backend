const { type } = require("os")

// salonDetail.js
module.exports = (sequelize, DataTypes) => {
  const salonDetail = sequelize.define('salonDetail', {
    approvedByAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    registrationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    registrationExpiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    salonName: {
      type: DataTypes.STRING(),
      allowNull: true,
      defaultValue: '',
    },
    businessEmail: {
      type: DataTypes.STRING(),
      allowNull: true,
      defaultValue: '',
    },
    businessCountryCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    businessPhoneNum: {
      type: DataTypes.STRING(72),
      allowNull: true,
      defaultValue: '',
    },
    description: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING(),
      allowNull: true,
      // validate: {
      //   notNull: {
      //     msg: 'Cover image is Required'
      //   },
      //   notEmpty: {
      //     msg: 'Cover image cannot be empty'
      //   }
      // }
    },
    teamSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    subscriptionPlan: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    connectAccountId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    onlinePayments: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    liveStatusChangedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        freeTrialDays: '',
        members: '',
        membersCount: '',
        paymentMethodId: '',
        sloanId: '',
        subscriptionName: '',
      },
    },
    subscriptionPrice: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    hasObtainedFreeTrial: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    subscriptionLatestPaymentStatus: {
      type: DataTypes.STRING(),
      allowNull: true,
      defaultValue: 'payment_succeeded',
    },
    stickerSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isExternalEmployee: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    parentSalonId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isVATRegistered: {
      type:DataTypes.BOOLEAN,
      defaultValue:false,
    },
    vatType:{
      type:DataTypes.STRING(100),
      allowNull:true,
    },
    vatPercentage:{
      type:DataTypes.DECIMAL(10, 2),
      allowNull:true,
    },
    platformFee:{
      type:DataTypes.DECIMAL(10, 2),
      allowNull:true,
      defaultValue:0,
    }
  })

  salonDetail.associate = (models) => {
    models.user.hasMany(salonDetail)
    salonDetail.belongsTo(models.user)

    salonDetail.hasMany(models.employee)
    models.employee.belongsTo(salonDetail)

    models.addressDBS.hasMany(salonDetail)
    salonDetail.belongsTo(models.addressDBS)

    salonDetail.hasMany(models.rating)
    models.rating.belongsTo(salonDetail)

    salonDetail.hasMany(models.socialLink)
    models.socialLink.belongsTo(salonDetail)

    salonDetail.hasMany(models.time)
    models.time.belongsTo(salonDetail)

    salonDetail.hasMany(models.favorite)
    models.favorite.belongsTo(salonDetail)

    salonDetail.hasMany(models.employeeService)
    models.employeeService.belongsTo(salonDetail)

    salonDetail.hasMany(models.employeeAccessDefault)
    models.employeeAccessDefault.belongsTo(salonDetail)

    salonDetail.hasMany(models.salonTimeHistory)
    models.salonTimeHistory.belongsTo(salonDetail)

    salonDetail.hasMany(models.blockCustomer)
    models.blockCustomer.belongsTo(salonDetail)

    salonDetail.hasMany(models.announcement)
    models.announcement.belongsTo(salonDetail)

    salonDetail.hasMany(models.subscriptions)
    models.subscriptions.belongsTo(salonDetail)

    salonDetail.hasMany(models.salonProfiles)
    models.salonProfiles.belongsTo(salonDetail)

    salonDetail.hasMany(models.allergies)
    models.allergies.belongsTo(salonDetail)

    salonDetail.hasMany(models.clientNotes)
    models.clientNotes.belongsTo(salonDetail)

    salonDetail.hasMany(models.rentCollection) // only for external employee salon id
    models.rentCollection.belongsTo(salonDetail)
  }

  return salonDetail
}
