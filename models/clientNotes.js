module.exports = (sequelize, DataTypes) => {
  const clientNotes = sequelize.define('clientNotes', {
    customerNote: {
      type: DataTypes.STRING(),
      allowNull: true,
      defaultValue: '',
    },
  })

  return clientNotes
}
