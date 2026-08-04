const trainService = require("../../services/trainService");
const {getConnectionId} = require("../../services/availabilityService");
const LODZ = 46706;
const BYDGOSZCZ = 16717;
const KUTNO = 32201;
let connection;
let connectionId;
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year}T${hour}:${minutes}:00`;
}
beforeAll(async () => {
    console.log("beforeAll start");
    const date = formatDate(new Date());
    console.log("getting connections");
    const result = await trainService.getConnections(date, LODZ, KUTNO);
    connection = result[0];
    connectionId=getConnectionId(connection.uuid);
});
it("should return at least one connection", async () => {
    expect(connection).toHaveProperty("uuid");
    expect(connection).toHaveProperty("legs");
});
it("should return prices", async () => {
    const prices = await trainService.getConnectionPrice(connectionId);
    if (!prices) {
        return;
    }
    expect(prices).not.toBe(null);
    expect(prices).toHaveProperty("tariff_ids");
});
it("should return tariff ids", async () => {
    const tariffIds = await trainService.getTariffids(connectionId);
    expect(tariffIds).toEqual(expect.any(Array));
});
it("should return nested seats", async () => {
    const tariffIds = await trainService.getTariffids(connectionId);
    expect(Array.isArray(tariffIds)).toBe(true);
    const nestedSeats = await trainService.getNestedSeats(connectionId,tariffIds);
    expect(nestedSeats).not.toBe(null);
    expect(nestedSeats).toHaveProperty("train_place_types");
});
it("should return place types", async () => {
    const tariffIds = await trainService.getTariffids(connectionId);
    expect(Array.isArray(tariffIds)).toBe(true);
    const placeTypes = await trainService.getPlaceTypes(connectionId,tariffIds);
    expect(placeTypes).toEqual(expect.any(Array));
    if (placeTypes.length > 0) {
        expect(placeTypes[0].placeTypes[0]).toEqual(
            expect.objectContaining({
                id: expect.any(Number),
                name: expect.any(String),
                available: expect.any(Boolean)
            })
        );
    }
});