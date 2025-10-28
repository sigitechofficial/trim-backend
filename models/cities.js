const { Sequelize } = require("sequelize");

module.exports=(sequelize,DataTypes)=>{
    const cities=sequelize.define('cities',{
        name:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        lat:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        lng:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        status:{
            type:DataTypes.BOOLEAN,
            allowNull:true,
            defaultValue:true,
        },
    },{
        timestamps:true,
        paranoid:true,
    })

    cities.associate=(models)=>{
        cities.hasMany(models.zones);
        models.zones.belongsTo(cities);
    }
    return cities;
}