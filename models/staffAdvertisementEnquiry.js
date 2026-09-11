module.exports = (sequelize, DataTypes) => {
  const staffAdvertisementEnquiry = sequelize.define(
    'staffAdvertisementEnquiry',
    {
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING(72),
        allowNull: false,
      },
      currentLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      yearsExperience: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      socialMedia: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      preferredWorkingDays: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
    },
  )

  staffAdvertisementEnquiry.associate = (models) => {
    staffAdvertisementEnquiry.belongsTo(models.salonDetail)
    staffAdvertisementEnquiry.belongsTo(models.user, {
      foreignKey: 'customerUserId',
      as: 'customer',
    })
    staffAdvertisementEnquiry.hasMany(
      models.staffAdvertisementEnquiryMessage,
    )
  }

  return staffAdvertisementEnquiry
}
