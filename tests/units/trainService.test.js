jest.mock("../../services/pkpApi");

jest.mock("../../services/availabilityService");
const { getConnectionId } = require("../../services/availabilityService");

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year}T${hour}:${minutes}:00`;
}
const api = require("../../services/pkpApi");
const trainService = require("../../services/trainService");

const LODZ = 46706;
const BYDGOSZCZ = 16717;
const KUTNO = 32201;
const connections = require("../fixtures/fullConnection.json");
let date;
beforeEach(async () => {
  getConnectionId.mockResolvedValue(123);
  date = formatDate(new Date());
  api.post.mockImplementation((url, body) => {
    if (url === "/eol_connections/search") {
      return Promise.resolve({
        data: connections,
      });
    }
    if (url === "/connections/123/options/tariff_ids") {
      return Promise.resolve({
        data: [1234, 5678],
      });
    }
    if (url === "/nested_train_place_types/123") {
      return Promise.resolve({
        data: {
          train_place_types: [
            {
              place_type: {
                place_types: [
                  {
                    place_types: [
                      {
                        id: 1,
                        name: "First Class",
                        available: true,
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      });
    }
    throw new Error(`Unexpected endpoint: ${url}`);
  });
  api.get.mockImplementation((url) => {
    if (url.includes("/options/tariff_ids")) {
      return Promise.resolve({
        data: {
          prices: [
            {
              tariff_ids: [1234, 5678],
            },
          ],
        },
      });
    }
    if (url.includes("/price")) {
      return Promise.resolve({
        data: {
          prices: [
            {
              tariff_ids: [1234, 5678],
            },
          ],
        },
      });
    }
    throw new Error(`Unexpected endpoint: ${url}`);
  });
});
afterEach(() => {
  jest.clearAllMocks();
});
it("should return train connections", async () => {
  const result = await trainService.getConnections(date, LODZ, KUTNO);
  const connection = result[0];
  expect(connection).toHaveProperty("uuid");
  expect(connection).toHaveProperty("legs");
});
it("should return authentication error", async () => {
  api.post.mockImplementationOnce((url, body) => {
    if (url === "/eol_connections/search") {
      return Promise.reject({
        response: {
          status: 401,
          data: {
            message: "Unauthorized",
          },
        },
      });
    }
    throw new Error(`Unexpected endpoint: ${url}`);
  });
  await expect(trainService.getConnections(date, LODZ, KUTNO)).rejects.toThrow(
    "Failed to get connections from PKP API: Unauthorized",
  );
});
it("should return connection price", async () => {
  const result = await trainService.getConnections(date, LODZ, KUTNO);
  const connection = result[0];
  const connectionId = await getConnectionId(connection.uuid);
  const prices = await trainService.getConnectionPrice(connectionId);
  expect(prices).toHaveProperty("tariff_ids");
});
it("should return tariff ids", async () => {
  const result = await trainService.getConnections(date, LODZ, KUTNO);
  const connection = result[0];
  const connectionId = await getConnectionId(connection.uuid);
  const tariffIds = await trainService.getTariffids(connectionId);
  expect(tariffIds).toEqual(expect.any(Array));
  expect(tariffIds.length).toBeGreaterThan(0);
});
it("should return nested seats", async () => {
  const result = await trainService.getConnections(date, LODZ, KUTNO);
  const connection = result[0];
  const connectionId = await getConnectionId(connection.uuid);
  const tariffIds = await trainService.getTariffids(connectionId);
  const nestedSeats = await trainService.getNestedSeats(
    connectionId,
    tariffIds,
  );
  expect(nestedSeats).toHaveProperty("train_place_types");
});
it("should return place types", async () => {
  const result = await trainService.getConnections(date, LODZ, KUTNO);
  const connection = result[0];
  const connectionId = await getConnectionId(connection.uuid);
  const tariffIds = await trainService.getTariffids(connectionId);
  const placeTypes = await trainService.getPlaceTypes(connectionId, tariffIds);
  expect(placeTypes).toEqual(expect.any(Array));
  if (placeTypes.length > 0) {
    expect(placeTypes[0].placeTypes[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        available: expect.any(Boolean),
      }),
    );
  }
});
