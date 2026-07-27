{const fs = require("fs/promises");
const api = require("./pkpApi");
let stationsCache = [];
const path = require("path");
const STATIONS_FILE = path.join(
    __dirname,
    "../data",
    "station.json"
);
const loadStationsFromFile = async () => {
        const file = await fs.readFile(STATIONS_FILE, "utf8");
        stationsCache = JSON.parse(file);
};
const initialize =async ()=>{
    try {
        await loadStationsFromFile();
    } catch (err) {
        try {
            await refreshStations();
        } catch (err) {
            console.error(err);
            throw new Error("Failed to initialize stations cache.");
        }
        if (stationsCache.length === 0) {
            throw new Error("Stations cache is empty after refresh.");
        }           
    }
    
};
const fetchStations = async () => {
    const response = await api.get("/stations");
    return response.data.filter(
        station => station.country?.toLowerCase() === "polska"
    );
    console.log(response.data.length);
};
const getStations = () => {
    return stationsCache;
};

const searchStation = (query)=>{
     const normalizedQuery = query.trim().toLowerCase();
     const data = getStations();
     const result=data.filter(station => station.name.toLowerCase().includes(normalizedQuery));
     return result;
};
const saveStationsToFile = async (stations) =>{
    try{
        await fs.writeFile(STATIONS_FILE,JSON.stringify(stations, null, 2),{encoding: "utf8"});
    }
    catch(e){
        console.error(e.message);
    }

};
const refreshStations = async() => {
    const stations = await fetchStations();
    stationsCache = stations;
    await saveStationsToFile(stations);
}
const getStationById = (stId) => {
    return stationsCache.find(({id})=>id===stId);
};
module.exports = {
    refreshStations,
    getStationById,
    getStations,
    searchStation,
    initialize
}}