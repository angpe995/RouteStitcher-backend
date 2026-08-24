const routeService=require("../services/routeProcessingService");
const availabilityService = require("../services/availabilityService");
const checkRoute = async (req, res) => {
  try {
    const { connectionUUID } = req.params;
    const { tickets, placeClass } = req.body;
    if (!connectionUUID || !tickets) {
      return res.status(400).json({
        error: "connectionUUID and tickets are required",
      });
    }
    const result = await routeService.checkRoute(
      connectionUUID,
      Number(tickets),
      Number(placeClass),
    );
    return res.json(result);
  } catch (error) {
    console.error("Failed to check route:", error);

    return res.status(500).json({
      error: "Failed to check route",
    });
  }
};
module.exports={
    checkRoute
}