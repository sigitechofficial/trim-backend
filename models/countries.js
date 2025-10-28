const { Sequelize } = require("sequelize");

module.exports=(sequelize,DataTypes)=>{
    const countries=sequelize.define('countries',{
        name:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        shortName:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        image:{
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

    countries.associate=(models)=>{
        countries.hasMany(models.cities);
        models.cities.belongsTo(countries);  
    }
    return countries;
}