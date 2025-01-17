module.exports = (sequelize, DataTypes) => {
  const slaonProfile = sequelize.define('slaonProfile', {
    hasBusinessDetails: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    hasBusinessAddress: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    hasServiceList: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    hasWorkingHours: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    hasTeamMembers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    hasSubscription: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    accountConnected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  })

  return slaonProfile
}
