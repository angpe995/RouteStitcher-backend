const trainService = require("./trainService");
const availabilityService = require("./availabilityService");
const getAllPlaceTypes = async (connectionId, tariffIds) => {
  const result = [];
  const placeTypes = await trainService.getPlaceTypes(connectionId, tariffIds);
  result.push(...placeTypes);
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
    const trainResult = {
      train_nr: train.train_nr,
      place_types: [],
    };
    const seatSelectableTypes = train.place_types.filter((placeType) => {
      return (
        placeType.available &&
        (placeType.reservation_modes?.seat_map === true ||
          placeType.reservation_modes?.place_indication === true)
      );
    });
    const nonSelectableTypes = train.place_types.filter((placeType) => {
      return (
        placeType.available &&
        placeType.reservation_modes?.seat_map !== true &&
        placeType.reservation_modes?.place_indication !== true
      );
    });

    for (const placeType of nonSelectableTypes) {
  trainResult.place_types.push({
    id: placeType.id,
    seats: [],
    available: placeType.available,
    name: placeType.name,
    seat_selection_available: false,
    reservation_modes: placeType.reservation_modes,
  });
}
    const ids = seatSelectableTypes.map((placeType) => placeType.id);
    if (ids.length !== 0) {
      const seats = await availabilityService.checkTrainAvailability(
        connection,
        train.train_nr,
        ids,
      );
      for (const seatType of seats.place_types) {
        const original = train.place_types.find((p) => p.id === seatType.id);
        if (!original) {
          continue;
        }
        seatType.name = original.name;
        seatType.seat_selection_available = true;
        seatType.reservation_modes = original.reservation_modes;
      }
      trainResult.place_types.push(...seats.place_types);
    }
    result.push(trainResult);
  }
  //console.log("RESULT:::",result[0].place_types[1]);
  return result;
};
module.exports = {
  checkAvailability,
};
