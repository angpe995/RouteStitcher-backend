const express = require("express");
const cors = require("cors");

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

module.exports = app;
