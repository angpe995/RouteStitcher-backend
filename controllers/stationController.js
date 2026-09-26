const stationService = require("../services/stationService");

exports.getStations = async (req, res) => {
    try {
        const stations = await stationService.getStations();

        console.log("RETURNING:", stations.length);

        res.json(stations);
    } catch (err) {
        console.error("GET STATIONS ERROR:", err);

        res.status(500).json({
            error: err.message
        });
    }
};
