const express = require('express');
const cors = require('cors');
const stationService = require("./services/stationService");
const brandService = require("./services/brandService");
const app = express();
const PORT = 5000;
const searchRoutes = require("./routes/search");
const stationRoutes = require('./routes/stations');
const checkRouteAvailability = require("./routes/check");
const getBrand=require("./routes/brand");
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Бекенд на Express успішно запущено! 🚀');
});
app.use("/api/brands", getBrand);
app.use("/api/search", searchRoutes);
app.use('/api/stations', stationRoutes);
app.use("/api", checkRouteAvailability);
app.listen(PORT, () => {
  console.log(`Сервер стартував на http://localhost:${PORT}`);
});
app.get('/')
async function startServer() {
    try {
        await stationService.initialize();
        await brandService.initialize();
        app.listen(PORT, () => {
            console.log(`Server started on http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
}

startServer();