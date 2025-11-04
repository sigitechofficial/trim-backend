const { zones, cities, countries } = require("../models");
const { Op, literal, col, fn, where } = require('sequelize')
const sequelize = require("sequelize");
const findZones = async (lat, lng) => {
    console.log("LAT++++++++++",lat);
    console.log("LAT++++++++++",lng);
    const findZone = await zones.findAll({
        where: {
            status: true,
            coordinates: sequelize.where(
                sequelize.fn(
                    "ST_Contains",
                    sequelize.col("coordinates"),
                    sequelize.fn("ST_GeomFromText", `POINT(${lng} ${lat})`)
                ),
                true
            ),
        },
        include: [
            {
                model: cities,
                attributes: ["id", "name", "lat", "lng", "status"],
                include: [
                    {
                        model: countries,
                        attributes: ["id", "name", "shortName", "status"],
                    },
                ],
            },
        ],
    });
    
    console.log("findZone====================>>>",findZone)
    return findZone;
}


module.exports = { findZones };
