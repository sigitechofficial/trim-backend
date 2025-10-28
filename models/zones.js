const { type } = require("os");
const { Sequelize } = require("sequelize");

module.exports=(sequelize,DataTypes)=>{
    const zones=sequelize.define('zones',{
        zoneName:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        status:{
            type:DataTypes.BOOLEAN,
            allowNull:true,
            defaultValue:true,
        },
        coordinates:{
            type: DataTypes.GEOMETRY('POLYGON'),
            allowNull:false,
        }
    },{
        timestamps:true,
        paranoid:true,
    })

    zones.associate=(models)=>{
    }
    return zones;
}