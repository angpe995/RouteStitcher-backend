const trainService = require("./trainService");
const availabilityService = require("./availabilityService");
const getAllPlaceTypes = async (connectionId, tariffIds) => {
  const result = [];
  for (const tariffId of tariffIds) {
    const placeTypes = await trainService.getPlaceTypes(connectionId, [
      tariffId,
    ]);
    result.push(...placeTypes);
  }
  return result;
};
const checkAvailability = async (connection) => {
  const connectionId = await availabilityService.getConnectionId(
    connection.uuid,
  );
  const tarrifIDs = await trainService.getTariffids(connectionId);
  if (tarrifIDs.length === 0) {
    return;
  }
  const placeTypes = await getAllPlaceTypes(connectionId, tarrifIDs);
  const result = [];
  for (const train of placeTypes) {
    const ids = train.placeTypes.map((p) => p.id);
    const seats = await availabilityService.checkWholeConnection(
      connection,
      ids,
    );
    const trainSeats = seats.find((t) => t.train_nr === train.train_nr);
    for (const seatType of trainSeats.place_types) {
      const original = train.placeTypes.find((p) => p.id === seatType.id);
      seatType.name = original.name;
      seatType.seatSelection = original.reservation_modes.seat_map;
    }
    result.push(trainSeats);
  }
  return result;
};
module.exports = {
  checkAvailability,
};
