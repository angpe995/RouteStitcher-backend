const { getAccessToken } = require("./authService");
const { getConnectionPrice } = require("./trainService");
const api = require("./pkpApi");
const fetchSeatsAvailability = async (connectionId, trainId, seatClass) => {
  const token = await getAccessToken();
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
  const response = await api.put(`/eol_connections/${uuid}/connection_id`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.connection_id;
};
const getFreeSeats = (seats) => {
  return seats.filter((seat) => seat.state === "FREE");
};
const checkWholeConnection = async (connection, placeTypeIds) => {
  if (!connection.legs?.length) {
    return [];
  }
  const results = [];
  const connectionId = await getConnectionId(connection.uuid);
  let index = 0;
  for (const leg of connection.legs) {
    if (leg.leg_type !== "train_leg") {
      continue;
    }
    let placeTypes = [];
    for (const placeTypeId of placeTypeIds) {
      try {
        const seats = await fetchSeatsAvailability(
          connectionId,
          leg.train_nr,
          placeTypeId,
        );
        placeTypes.push({ id: placeTypeId, seats: getFreeSeats(seats.seats) });
      } catch (e) {
        if (e.response?.status === 422) {
          continue;
        }
      }
    }
    results.push({
      train_nr: leg.train_nr,
      origin_station_id: leg.origin_station_id,
      destination_station_id: leg.destination_station_id,
      place_types: placeTypes,
    });
    index++;
  }
  return results;
};
module.exports = {
  checkWholeConnection,
  getFreeSeats,
  getConnectionId,
  fetchSeatsAvailability,
};
