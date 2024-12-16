// service.js
module.exports = (sequelize, DataTypes) => {
  const unAcknowledgedEvents = sequelize.define(
    'unAcknowledgedEvents',
    {
      to: {
        type: DataTypes.STRING(),
        allowNull: false,
      },
      event: {
        type: DataTypes.STRING(),
        allowNull: true,
      },
      data: {
        type: DataTypes.TEXT,
        allowNull: true, // You may adjust this based on your requirements
      },
      bookingId: {
        type: DataTypes.INTEGER,
        allowNull: true, // You may adjust this based on your requirements
      },
    },
    {
      indexes: [
        {
          fields: ['to'],
          name: 'to_index',
        },
        {
          fields: ['bookingId'],
          name: 'bookingId_index',
        },

        {
          fields: ['event'],
          name: 'event_index',
        },
      ],
    },
  )

  return unAcknowledgedEvents
}
