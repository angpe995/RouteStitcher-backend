const api = require("./pkpApi");

let stationsCache = [];

const fetchStations = async () => {
    const response = await api.get("/stations");

    return response.data.filter(
        station => station.country?.toLowerCase() === "polska"
    );
};

const initialize = async () => {
    console.log("INITIALIZE START");

    try {
        await loadStationsFromFile();

        console.log(
            "LOADED FROM FILE:",
            stationsCache.length
        );

    } catch (err) {
        console.log("FILE LOAD FAILED:", err.message);

        try {
            await refreshStations();

            console.log(
                "REFRESHED:",
                stationsCache.length
            );

        } catch (err) {
            console.error("REFRESH FAILED:", err);
            throw new Error("Failed to initialize stations cache.");
        }
    }
};

const getStations = () => {
    return stationsCache;
};

const searchStation = (query) => {
    const normalizedQuery = query.trim().toLowerCase();

    return stationsCache.filter(station =>
        station.name.toLowerCase().includes(normalizedQuery)
    );
};

const refreshStations = async () => {
    stationsCache = await fetchStations();
};

const getStationById = (stId) => {
    return stationsCache.find(({ id }) => id === stId);
};

module.exports = {
    refreshStations,
    getStationById,
    getStations,
    searchStation,
    initialize
};
