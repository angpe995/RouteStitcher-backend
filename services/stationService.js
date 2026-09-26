const api = require("./pkpApi");

let stationsCache = [];

const fetchStations = async () => {
    console.log("FETCHING STATIONS FROM PKP");

    const response = await api.get("/stations");

    console.log("PKP STATUS:", response.status);
    console.log("PKP COUNT:", response.data.length);

    return response.data.filter(
        station => station.country?.toLowerCase() === "polska"
    );
};

const getStations = async () => {
    if (stationsCache.length === 0) {
        stationsCache = await fetchStations();
    }

    return stationsCache;
};

const refreshStations = async () => {
    stationsCache = await fetchStations();
    return stationsCache;
};

const searchStation = async (query) => {
    const stations = await getStations();

    const normalizedQuery = query.trim().toLowerCase();

    return stations.filter(station =>
        station.name.toLowerCase().includes(normalizedQuery)
    );
};

const getStationById = async (stId) => {
    const stations = await getStations();

    return stations.find(({ id }) => id === stId);
};

module.exports = {
    refreshStations,
    getStationById,
    getStations,
    searchStation
};
