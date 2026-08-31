module.exports = (sequelize, DataTypes) => {
  const staffAdvertisementEnquiryMessage = sequelize.define(
    'staffAdvertisementEnquiryMessage',
    {
      staffAdvertisementEnquiryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      senderRole: {
        type: DataTypes.ENUM('customer', 'salon'),
        allowNull: false,
      },
      senderUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    },
  )

  staffAdvertisementEnquiryMessage.associate = (models) => {
    models.staffAdvertisementEnquiry.hasMany(staffAdvertisementEnquiryMessage)
    staffAdvertisementEnquiryMessage.belongsTo(
      models.staffAdvertisementEnquiry,
    )
    staffAdvertisementEnquiryMessage.belongsTo(models.user, {
      foreignKey: 'senderUserId',
      as: 'sender',
    })
  }

  return staffAdvertisementEnquiryMessage
}
