module.exports = (sequelize, DataTypes) =>{
    const cancelledBooking = sequelize.define('cancelledBooking', { 
        reasonText:{
            type: DataTypes.STRING(),
            default:""
        }
    });
    
    return cancelledBooking;
};