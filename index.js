const express = require('express');
const cors = require('cors');
const stationService = require("./services/stationService");
const app = express();
const PORT = 5000;

const stationRoutes = require('./routes/stations');

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Бекенд на Express успішно запущено! 🚀');
});

app.use('/api/stations', stationRoutes);
app.listen(PORT, () => {
  console.log(`Сервер стартував на http://localhost:${PORT}`);
});
app.get('/')
async function startServer() {
    try {
        await stationService.initialize();

        app.listen(PORT, () => {
            console.log(`Server started on http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
}

startServer();