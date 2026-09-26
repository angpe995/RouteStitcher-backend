const express = require("express");
const router = express.Router();

const stationController = require("../controllers/stationController");

router.get("/", async (req, res) => {
    console.log("STATIONS REQUEST");

    const stations = stationsService.getStations();

    console.log("CACHE LENGTH:", stations.length);

    res.json(stations);
});

module.exports = router;
