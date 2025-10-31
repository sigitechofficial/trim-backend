const { zone, cities, countries, sequelize } = require("../models");

const findZones = async (lat, lng) => {
    const findZone = await zone.findAll({
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
    return findZone;
}

module.exports = { findZones };
