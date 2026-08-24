const api = require("./pkpApi");
const { getAccessToken } = require("./authService");

const getConnections = async (date, start, end) => {
  try {
    const response = await api.post("/eol_connections/search", {
      start_id: start,
      end_id: end,
      departure_after: date,
      only_direct: false,
    });
    return response.data;
  } catch (e) {
    if (e.response?.status === 401) {
      throw new Error(
        "Failed to get connections from PKP API: " + e.response.data.message,
      );
    }
    throw new Error("Failed to get connections from PKP API: " + e.message);
  }
};
const getConnectionPrice = async (connection_id) => {
  try {
    const result = await api.get(
      `/connections/${connection_id}/price?context=traveloptions`,
    );
    return result.data.prices;
  } catch (e) {
    if (e.response?.status === 404) {
      console.log("Status:", e.response?.status);
      console.dir(e.response?.data, { depth: null });
      return null;
    }
    console.error(e.message);
    console.log(e.response?.status);
    console.log(e.response?.data);
    throw new Error("Failed to get connection price.");
  }
};
const getTariffids = async (connection_id) => {
  const respone = await getConnectionPrice(connection_id);
  if (!respone) {
    return [];
  }
  return respone.flatMap((price) => price.tariff_ids);
};
const getNestedSeats = async (connectionID, tariffId) => {
  try {
    const token = await getAccessToken();
    const response = await api.post(
      `/nested_train_place_types/${connectionID}`,
      {
        tariff_ids: tariffId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (e) {
    console.error(e.message);
    if (e.response?.status === 422) {
      return {
        train_place_types: [],
      };
    }
  }
};
const getPlaceTypes = async (connectionID, tariffId) => {
  const nestedSeats = await getNestedSeats(connectionID, tariffId);
  if (!nestedSeats?.train_place_types?.length) {
    return [];
  }
  const placeTypes = nestedSeats.train_place_types.map((train) => {
    const options = train.place_type?.place_types ?? [];
    return {
      train_nr: train.train_nr,
      place_types: options.flatMap((type) =>
        (type.place_types ?? []).map((placeType) => ({
          id: placeType.id,
          name: placeType.name,
          available: placeType.available,
          reservation_modes: placeType.reservation_modes,
        })),
      ),
    };
  });
  return placeTypes;
};
const searchConnections = async (date, start, end, limit = 4) => {
  const connections = await getConnections(date, start, end);
  return connections.slice(0, limit);
};
module.exports = {
  getConnections,
  getConnectionPrice,
  getTariffids,
  getNestedSeats,
  getPlaceTypes,
  searchConnections
};
