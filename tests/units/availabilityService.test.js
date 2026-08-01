jest.mock('../../services/pkpApi');
const api = require("../../services/pkpApi");
const availabilityService = require("../../services/availabilityService");
const connections = require("../fixtures/fullConnection.json");
const connection=connections[0];
beforeEach(() => {
    api.put.mockImplementation((url, body) => {
        if (url.includes("/connection_id")) {
            return Promise.resolve({
                data: {
                    connection_id: 123
                }
            });
        }
            });
    });
afterEach(() => {
    jest.clearAllMocks();
});
it("should return connectionId", async () => {
    const result = await availabilityService.getConnectionId(connection.uuid);
    expect(result).toBe(123);
    expect(api.put).toHaveBeenCalledWith(
        expect.stringContaining("/connection_id"),
        expect.any(Object)
    );
});
