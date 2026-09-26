const express = require("express");
const cors = require("cors");

const stationService = require("./services/stationService");
const brandService = require("./services/brandService");

const searchRoutes = require("./routes/search");
const stationRoutes = require("./routes/stations");
const checkRouteAvailability = require("./routes/check");
const getBrand = require("./routes/brand");
const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Бекенд на Express успішно запущено! 🚀");
});
app.use("/api/brands", getBrand);
app.use("/api/search", searchRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api", checkRouteAvailability);
async function initialize() {
    try {
        await stationService.initialize();
        await brandService.initialize();

        console.log("Services initialized successfully");
    } catch (err) {
        console.error("Failed to initialize services:", err);
    }
}
initialize();
module.exports = app;
