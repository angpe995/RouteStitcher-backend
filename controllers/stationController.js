const stationService = require("../services/stationService");
exports.getStations = (req, res) => {
    try {
        const stations = stationService.getStations();

        res.json(stations);
    } catch (err) {
        console.error("GET STATIONS ERROR:", err);

        res.status(500).json({
            error: err.message
        });
    }
};
