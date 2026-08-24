const routeStitcher = require("../algorithms/routeStitching");
const availabilityService = require("../services/availabilityService");

const checkRoute = async (connectionUUID, tickets, placeClass) => {
  const connection = await availabilityService.getConnectionByUUID(connectionUUID);
  if (!connection) {
    throw new Error("Connection not found");
  }
  return routeStitcher.routeStitcher(
    connection,
    tickets,
    placeClass,
  );
};
module.exports = {
  checkRoute,
};