// A shop's chair offer to a renter in the chair market. The latest terms are
// copied here from the newest chairOfferRound; accepting creates a renterMove.
module.exports = (sequelize, DataTypes) => {
  const chairOffer = sequelize.define(
    'chairOffer',
    {
      renterUserId: { type: DataTypes.INTEGER, allowNull: false },
      // Null for someone who applied from the client app and is not a chair renter yet.
      renterSalonId: { type: DataTypes.INTEGER, allowNull: true },
      // 'chair' (rent a chair) or 'staff' (a job in the shop's team).
      kind: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'chair' },
      // 'business' (a chair renter in the business app) or 'client' (the client app).
      source: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'business' },
      // Client app applicants: name, email, phone, experience, location, days, note (JSON).
      applicantInfo: { type: DataTypes.TEXT, allowNull: true },
      // Staff jobs: 'salary' or 'commission' (rentAmount holds the amount or %).
      payType: { type: DataTypes.STRING(16), allowNull: true },
      // Chair offers: the shop covers the renter's Trim plan (uses a team seat).
      coversPlan: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      // What the renter or applicant asked for: 'covered' (the shop's plan) or
      // 'own' (their own £6.99 plan). The shop decides with coversPlan.
      planWish: { type: DataTypes.STRING(8), allowNull: true },
      // After a client app applicant is accepted: starting | joined | not_started.
      stage: { type: DataTypes.STRING(16), allowNull: true },
      startAsks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      startAskedOn: { type: DataTypes.DATEONLY, allowNull: true },
      shopSalonId: { type: DataTypes.INTEGER, allowNull: false },
      createdBy: { type: DataTypes.INTEGER, allowNull: true },
      // open | accepted | declined | withdrawn | expired | closed (renter took another offer)
      // | cancelled (the move it set up was cancelled)
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'open' },
      // Who sent the latest round: 'shop' | 'renter'. The other side answers.
      lastBy: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'shop' },
      rounds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      rentAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      rentCycle: { type: DataTypes.STRING(16), allowNull: true },
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      trialDate: { type: DataTypes.DATEONLY, allowNull: true },
      shopTerms: { type: DataTypes.TEXT, allowNull: true },
      renterTerms: { type: DataTypes.TEXT, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      moveId: { type: DataTypes.INTEGER, allowNull: true },
      closedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      indexes: [
        { fields: ['renterUserId', 'status'] },
        { fields: ['shopSalonId', 'status'] },
        { fields: ['status', 'expiresAt'] },
      ],
    },
  )

  chairOffer.associate = (models) => {
    chairOffer.belongsTo(models.salonDetail, { as: 'shop', foreignKey: 'shopSalonId', constraints: false })
    chairOffer.belongsTo(models.salonDetail, { as: 'renterSalon', foreignKey: 'renterSalonId', constraints: false })
    chairOffer.belongsTo(models.user, { as: 'renter', foreignKey: 'renterUserId', constraints: false })
    chairOffer.hasMany(models.chairOfferRound, { as: 'history', foreignKey: 'offerId', constraints: false })
  }
  return chairOffer
}
