const { getAccessToken } = require("./authService");
const api = require("./pkpApi");
const getConnectionId=async(uuid)=>{
    const token = await getAccessToken();
    const response = await api.put(`/eol_connections/${uuid}/connection_id`,{headers: {
        Authorization: `Bearer ${token}`}});
    return response.data.connection_id;
};
module.exports = {
    getConnectionId
}
