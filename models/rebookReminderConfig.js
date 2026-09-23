module.exports = (sequelize, DataTypes) => {
  const rebookReminderConfig = sequelize.define(
    'rebookReminderConfig',
    {
      // Master on/off switch for the whole rebooking-reminder feature.
      isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      // Customer with exactly ONE completed booking is reminded this many
      // days after that booking (client rule: "1x booking = 3 week reminder").
      singleBookingDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 21,
      },
      // For customers with 2+ bookings we use the average gap between their
      // bookings, but clamp it so it never fires absurdly early or never.
      minIntervalDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      maxIntervalDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 180,
      },
      // Generic copy — used when the customer's last salon is no longer active
      // (tap opens Home).
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Time for your next appointment',
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "It's been a while — book your next visit with Trim in seconds.",
      },
      // Salon-oriented copy — used when the last salon is still active (tap
      // opens that salon). Use {salonName} as a placeholder for the salon name.
      salonTitle: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Ready for your next visit to {salonName}?',
      },
      salonBody: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "It's been a while since your visit to {salonName} — book your next appointment in seconds.",
      },
    },
    {
      timestamps: true,
    },
  )

  return rebookReminderConfig
}
