const api = require("./pkpApi");
const { getAccessToken } = require("./authService");

const getConnections = async (date, start, end) => {
    try{
        const response = await api.post(
        "/eol_connections/search",
        {
            start_id: start,
            end_id: end,
            departure_after: date,
            only_direct: false
        });
        return response.data;
    }catch(e){
        if(e.response?.status === 401){
            throw new Error("Failed to get connections from PKP API: "+ e.response.data.message);
        }
        throw new Error("Failed to get connections from PKP API: " + e.message);
    } 
};
const getConnectionPrice =async(connection_id) =>{
    try{
        const result=await api.get(`/connections/${connection_id}/price?context=traveloptions`)
        return result.data.prices[0];
    } catch(e)
    {
        console.error(e.message);
        throw new Error("Failed to get connection price.");
    }
};
const getTariffids=async(connection_id)=>{
    const respone = await getConnectionPrice(connection_id);
    return respone.tariff_ids;
};
const getNestedSeats=async(connectionID,tariffId)=>{
     try
     {
        const token = await getAccessToken();
        const response = await api.post(
            `/nested_train_place_types/${connectionID}`,   
            {
                tariff_ids: tariffId
            },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (e) {
        console.error(e.message);
    }   
};
const getPlaceTypes=async(connectionID,tariffId)=>{
    const token = await getAccessToken();
    const nestedSeats = await getNestedSeats(connectionID,tariffId);
    const placeTypes = nestedSeats.train_place_types?.[0]?.place_type?.place_types?.[0]?.place_types ?? [];
    return placeTypes;
};
module.exports={
    getConnections,
    getConnectionPrice,
    getTariffids,
    getNestedSeats,
    getPlaceTypes
}