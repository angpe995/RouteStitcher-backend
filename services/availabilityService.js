const { getAccessToken } = require("./authService");
const api = require("./pkpApi");
const fetchSeatsAvailability = async (connectionId, trainId, seatClass) => {
  const token = await getAccessToken();
//  console.log(`/seats_availability/${connectionId}/${trainId}/${seatClass}`);
  const response = await api.get(
    `/seats_availability/${connectionId}/${trainId}/${seatClass}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data;
};
const getConnectionId = async (uuid) => {
  const token = await getAccessToken();
  const response = await api.put(
    `/eol_connections/${uuid}/connection_id`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data.connection_id;
};
const getConnectionByUUID = async (getConnectionByUUID) => {
  const response = await api.get(`eol_connections/${getConnectionByUUID}`);
  return response.data;
};
const getFreeSeats = (seats) => {
  return seats.filter((seat) => seat.state === "FREE");
};
const checkTrainAvailability = async (connection, trainNr, placeTypeIds) => {
  if (!placeTypeIds.length) {
    return null;
  }
  const trainLeg = connection.legs?.find(
    (leg) => leg.leg_type === "train_leg" && leg.train_nr === trainNr,
  );
  if (!trainLeg) {
    return null;
  }
  const connectionId = await getConnectionId(connection.uuid);
  const placeTypes = [];
  for (const placeTypeId of placeTypeIds) {
    try {
      const seats = await fetchSeatsAvailability(
        connectionId,
        trainNr,
        placeTypeId,
      );
     
      const freeSeats = getFreeSeats(seats.seats);
       //console.log("AVAILSERVICE",freeSeats);
      placeTypes.push({
        id: placeTypeId,
        seats: freeSeats,
        available: freeSeats.length > 0,
      });
    } catch (e) {
      if (e.response?.status === 422) {
        continue;
      }
      throw e;
    }
  }
  return {
    train_nr: trainLeg.train_nr,
    origin_station_id: trainLeg.origin_station_id,
    destination_station_id: trainLeg.destination_station_id,
    place_types: placeTypes,
  };
};
module.exports = {
  checkTrainAvailability,
  getFreeSeats,
  getConnectionId,
  fetchSeatsAvailability,
  getConnectionByUUID,
};
