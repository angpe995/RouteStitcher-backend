jest.mock('../../services/pkpApi');
const api = require("../../services/pkpApi");
const availabilityService = require("../../services/availabilityService");
const connections = require("../fixtures/fullConnection.json");
const PLACE_TYPES=[1234,5678];
const seats = require("../fixtures/availibilityList.json");
beforeEach(() => {
    api.put.mockImplementation((url, body) => {
        if (url.includes("/connection_id")) {
            return Promise.resolve({
                data: {
                    connection_id: 6628393124
                }
            });
        }
            });
    api.get.mockImplementation((url) => {
        if (url.includes("/seats_availability")) {
            return Promise.resolve({
                data: seats
            });
        }
    });
});
afterEach(() => {
    jest.clearAllMocks();
});
it("should retrieve connection ID from connection UUID", async () => {
    const connection=connections[0];
    const result = await availabilityService.getConnectionId(connection.uuid);
    expect(result).toBe(6628393124);
    expect(api.put).toHaveBeenCalledWith(
        expect.stringContaining("/connection_id"),
        expect.any(Object)
    );
});
it("should return seats array", async () => {
    const connection=connections[0];
    const trainNr = connection.legs[0].train_nr;
    const result = await availabilityService.fetchSeatsAvailability(
        connection.uuid,
        trainNr,
        PLACE_TYPES
    );
    expect(result).toEqual(
        expect.objectContaining({ seats: expect.any(Array)
    }));
    expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("/seats_availability"),
        expect.any(Object));
});
it ("should return only FREE seats (getFreeSeats)", async () => {
    const connection=connections[0];
    const trainNr = connection.legs[0].train_nr;
    const result = await availabilityService.fetchSeatsAvailability(
        connection.uuid,
        trainNr,
        PLACE_TYPES
    );
    const freeSeats = availabilityService.getFreeSeats(result.seats);
    expect(freeSeats.every(seat => seat.state === "FREE")).toBe(true);
});
it("should return only FREE seats(checkWholeConnection)", async () => {
    const connection=connections[0];
    const result = await availabilityService.checkWholeConnection(
        connection,PLACE_TYPES
    );
    expect(result.every(train => train.place_types.every(placeType => placeType.seats.every(seat => seat.state === "FREE")))).toBe(true);
    expect(api.put).toHaveBeenCalled();
    expect(api.get).toHaveBeenCalled();
});