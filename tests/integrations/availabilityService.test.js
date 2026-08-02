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
const CHELM = 50906;
const getConnection = async(start,end,changes)=>{
    const date = formatDate(new Date());
    try
    {
        const result = await trainService.getConnections(date,start,end);
        for (const conn of result) {
            if (conn.changes !== changes) {
                continue;
            }
            return conn;
        }
    } catch (err){
         console.error("Failed to get Connection", err.message);
        throw err;
    }
};
it("should retrieve connection ID from connection UUID", async () => {
    const connection= await getConnection(KUTNO, LODZ,0);
    const result = await availabilityService.getConnectionId(connection.uuid);
    expect(result).toEqual(expect.any(Number));
});

it("should retrieve seat availability for a multi-leg connection", async () => {
  const connection = await getConnection(CHELM, LODZ, 1);
  const connectionId = await availabilityService.getConnectionId(connection.uuid,);
  const tarrifIDs = await trainService.getTariffids(connectionId);
  for (const tariffId of tarrifIDs) {
    const placeTypes = await trainService.getPlaceTypes(connectionId, [tariffId]);
    if (placeTypes.length === 0) {
      console.log("No place types found for tariff ID:", tariffId);
      continue;
    }
    for (const placeType of placeTypes) {
      const placeTypeIds = placeType.placeTypes.map((pt) => pt.id);
      if (placeTypeIds.length !== 0) {
        const seats = await availabilityService.checkWholeConnection(
          connection,
          placeTypeIds,
        );
        expect(seats[0]).toEqual(expect.objectContaining({
            train_nr: expect.any(Number),
            origin_station_id: expect.any(Number),
            destination_station_id: expect.any(Number),
            place_types: expect.any(Array),}),);
        for (const train of seats) {
          for (const placeType of train.place_types) {
            expect(placeType).toEqual(expect.objectContaining({id: expect.any(Number),seats: expect.any(Object),}),);}
          }
        expect(seats).toEqual(expect.any(Array));
        }
    }
  }
});
it("should retrieve seat availability for a single-leg connection", async () => {
  const connection = await getConnection(KUTNO, LODZ, 0);
  const connectionId = await availabilityService.getConnectionId(connection.uuid,);
  const tarrifIDs = await trainService.getTariffids(connectionId);
  for (const tariffId of tarrifIDs) {
    const placeTypes = await trainService.getPlaceTypes(connectionId, [
      tariffId,
    ]);
    if (placeTypes.length === 0) {
      console.log("No place types found for tariff ID:", tariffId);
      continue;
    }
    for (const placeType of placeTypes) {
      const placeTypeIds = placeType.placeTypes.map((pt) => pt.id);
      if (placeTypeIds.length !== 0) {
        const seats = await availabilityService.checkWholeConnection(connection,placeTypeIds);
        expect(seats[0]).toEqual(expect.objectContaining({
            train_nr: expect.any(Number),
            origin_station_id: expect.any(Number),
            destination_station_id: expect.any(Number),
            place_types: expect.any(Array),
          }),
        );
        for (const train of seats) {
          for (const placeType of train.place_types) {
            expect(placeType).toEqual(expect.objectContaining({id: expect.any(Number),seats: expect.any(Object),}),);
          }
        }
        expect(seats).toEqual(expect.any(Array));
      }
    }
  }
});
