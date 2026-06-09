module.exports = (sequelize, DataTypes) => {
  const rentChairAdvertisementEnquiryMessage = sequelize.define(
    'rentChairAdvertisementEnquiryMessage',
    {
      rentChairAdvertisementEnquiryId: {
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

  rentChairAdvertisementEnquiryMessage.associate = (models) => {
    models.rentChairAdvertisementEnquiry.hasMany(rentChairAdvertisementEnquiryMessage)
    rentChairAdvertisementEnquiryMessage.belongsTo(
      models.rentChairAdvertisementEnquiry,
    )
    rentChairAdvertisementEnquiryMessage.belongsTo(models.user, {
      foreignKey: 'senderUserId',
      as: 'sender',
    })
  }

  return rentChairAdvertisementEnquiryMessage
}
