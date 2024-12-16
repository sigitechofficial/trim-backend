module.exports = (sequelize, DataTypes) => {
    const billingHistory = sequelize.define("billingHistory", {
      billingAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      billingDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      // Add other relevant fields as needed
    });
  
    billingHistory.associate = (models) => {
      // Define associations here if needed
      models.employee.hasMany(billingHistory); 
      billingHistory.belongsTo(models.employee); 
  

    };
  
    return billingHistory;
  };