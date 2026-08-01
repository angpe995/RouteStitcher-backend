const trainService = require("../../services/trainService");
const availabilityService = require("../../services/availabilityService");
const api = require("../../services/pkpApi");
const {getBrandById}=require("../../services/brandService");
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year}T${hour}:${minutes}:00`;
}
const KATOWICE=73312;
const LODZ = 46706;
const KUTNO = 32201;
const GDANSK = 7500;
const KRAKOW =80416;
const ZGIERZ = 46707;
const getConnection = async(start,end)=>{
    const date = formatDate(new Date());
    try
    {
        const result = await trainService.getConnections(date,start,end);
        for (const conn of result) {
            if (conn.changes !== 0) {
                continue;
            }
            const brand = await getBrandById(conn.legs[0].commercial_brand_id);
            if (brand?.name === "IC") {
                return conn;
            }
        }
    } catch (err){
         console.error("Failed to get Connection", err.message);
        throw err;
    }
};
it("should retrieve connection ID from connection UUID", async () => {
    const connection= await getConnection(KATOWICE, LODZ);
    const result = await availabilityService.getConnectionId(connection.uuid);
    expect(result).toEqual(expect.any(Number));
});

