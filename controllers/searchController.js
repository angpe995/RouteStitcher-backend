const trainService = require("../services/trainService");

const searchRoutes = async (req, res) => {
  try {
    const { departure, destination, date } = req.query;
    if (!departure || !destination || !date) {
      return res.status(400).json({
        error: "departure, destination and date are required",
      });
    }
    const connections = await trainService.getConnections(
      date,
      Number(departure),
      Number(destination),
    );

    return res.json(connections);
  } catch (error) {
    console.error("Failed to search routes:", error);
    return res.status(500).json({
      error: "Failed to search routes",
    });
  }
};
module.exports = {
  searchRoutes,
};
