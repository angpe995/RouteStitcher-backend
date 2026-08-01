const { getAccessToken } = require("./authService");
const {getConnectionPrice} = require("./trainService");
const api = require("./pkpApi");
const fetchSeatsAvailability  = async (connectionId,trainId, seatClass) => {
    const token = await getAccessToken();
    const response = await api.get(`/seats_availability/${connectionId}/${trainId}/${seatClass}`,{headers: {
        Authorization: `Bearer ${token}`
    }});
    return response.data;
};
const getConnectionId=async(uuid)=>{
    const token = await getAccessToken();
    const response = await api.put(`/eol_connections/${uuid}/connection_id`,{headers: {
        Authorization: `Bearer ${token}`}});
    return response.data.connection_id;
};
const getFreeSeats = (seats) => {
    return seats.filter(seat => seat.state === "FREE");
};
const checkWholeConnection = async (
    connection, placeType)=> {
    if (!connection.legs?.length) {
        return [];
    }
    const connectionId = await getConnectionId(connection.uuid);
    const trainNr = connection.legs[0].train_nr;
    const response = await fetchSeatsAvailability(connectionId, trainNr, placeType);
    return getFreeSeats(response.seats);
};
module.exports = {
    checkWholeConnection,
    getFreeSeats,
    getConnectionId,
    fetchSeatsAvailability,
}
