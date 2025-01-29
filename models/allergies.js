module.exports = (sequelize, DataTypes) => {
  const allergies = sequelize.define('allergies', {
    allergyType: {
      type: DataTypes.ENUM('Non-drug', 'Drug', 'None'),
      allowNull: false,
      defaultValue: 'None',
    },
    severity: {
      type: DataTypes.ENUM('Mild', 'Moderate', 'Severe', 'Fatal', 'Unknown'),
      allowNull: true,
      defaultValue: 'Unknown',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'No known allergies',
    },
    reaction: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
  })

  return allergies
}
