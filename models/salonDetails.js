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
    terminalLocationId: {
      type: DataTypes.STRING(),
      allowNull: true,
    },
    onlinePayments: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // false = online bookings arrive as requests the shop must accept.
    autoAcceptBookings: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // Who needs approval when autoAcceptBookings is off: 'all' | 'new' (first-time clients).
    approvalScope: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: 'all',
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
    // Chair renter between shops: stays listed until this date (see helper/renterMove.js).
    renterGraceUntil: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // Chair renter on the free days before their own plan: the last reminder
    // sent (14, 7 or 1 days left, 0 once ended), so each goes out once.
    renterPlanReminderDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Chair renter whose Trim plan a shop covers: that shop's id. While set,
    // the renter row mirrors the shop's plan date and status 'shop_covered';
    // the renter's own plan is kept in renterOwnExpiry / renterOwnStatus.
    renterCoveredBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    renterOwnExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    renterOwnStatus: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    // How many times this renter got free days after a shop stopped covering
    // them: 7 days the first time, 3 after that (helper/renterCoverage.js).
    // The shop whose plan stopped covering this renter because that plan lapsed
    // (or ran out of seats). When the shop's plan is active again the owner
    // is asked once to cover them again; then it is cleared.
    renterUncoveredBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    renterGraceCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    },
    rentChairAdvertisementChairCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    rentChairAdvertisementStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Rent-a-chair advert rent: owner picks EITHER 'daily' or 'weekly' plus a
    // single amount (optional). Null/empty means no rent advertised.
    rentChairAdvertisementRentType: {
      type: DataTypes.STRING(16),
      allowNull: true,
      defaultValue: null,
    },
    rentChairAdvertisementRentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    // Staff advert: same shape as the rent-a-chair advert (on/off + count),
    // but WITHOUT any rent. Advertises staff positions the shop is hiring.
    staffAdvertisementCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    staffAdvertisementStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Staff advert wages method (advert info): owner picks 'salary' or
    // 'commission' plus one amount (£ for salary, % for commission). Optional.
    staffAdvertisementWagesType: {
      type: DataTypes.STRING(16),
      allowNull: true,
      defaultValue: null,
    },
    staffAdvertisementWagesAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    // Salary pay frequency (Weekly / Bi-weekly / Monthly); null for commission.
    staffAdvertisementWagesCycle: {
      type: DataTypes.STRING(16),
      allowNull: true,
      defaultValue: null,
    },
    stripeOnboardingStatus: {
      type: DataTypes.STRING(32),
      allowNull: true,
      defaultValue: 'NOT_STARTED',
    },
    stripeDetailsSubmitted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    stripeChargesEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    stripePayoutsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    stripeCurrentlyDue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stripePastDue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stripeDisabledReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    stripeRequirementsHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    stripeOnboardingStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    stripeLastStripeActivityAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    stripeLastReminderSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    stripeLastPayoutBlockedEmailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    stripeReminderStage: {
      type: DataTypes.STRING(16),
      allowNull: true,
      defaultValue: 'none',
    },
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

    salonDetail.hasMany(models.breakTime, {
      foreignKey: 'salonDetailId',
      as: 'breaks',
    })

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
