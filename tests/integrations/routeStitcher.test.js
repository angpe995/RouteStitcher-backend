const { routeStitcher } = require("../../algorithms/routeStitching");
const trainService = require("../../services/trainService");
const availabilityService = require("../../services/availabilityService");
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate() + 1).padStart(2, "0");
  const hour = String(date.getHours() - 12).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year}T${hour}:${minutes}:00`;
}
jest.setTimeout(230000);
const KATOWICE = 73312;
const LODZ = 46706;
const KUTNO = 32201;
const GDANSK = 7500;
const POZNAN = 30601;
const KRAKOW = 80416;
const ZGIERZ = 46707;
const BYDGOSZCZ = 18408;
const CHELM = 50906;
const WARSZAWA = 33605;
const LUBLIN = 50500;
const KOLOBRZEG = 4101;
const getConnection = async (start, end, changes) => {
  const date = formatDate(new Date());
  try {
    const result = await trainService.getConnections(date, start, end);
    for (const conn of result) {
      if (conn.changes !== changes && conn.legs[0].commercial_brand_id != 28) {
        continue;
      }
      return conn;
    }
  } catch (err) {
    console.error("Failed to get Connection", err.message);
    throw err;
  }
};

describe("routeStitcher integration", () => {
  let connection;
  let result;

  beforeAll(async () => {
    connection = await getConnection(KOLOBRZEG, BYDGOSZCZ, 0);
    result = await routeStitcher(connection, 3);
  });

  it("should return an array", () => {
    expect(result).toEqual(expect.any(Array));
  });

  it("should return valid variants", () => {
    console.log("RESULT", result);
    for (const variant of result) {
      expect(variant).toEqual(
        expect.objectContaining({
          uuid: expect.any(String),
          train_nr: expect.any(Number),
          train_name: expect.any(String),
          origin_station_id: expect.any(Number),
          destination_station_id: expect.any(Number),
          departure: expect.any(String),
          arrival: expect.any(String),
        }),
      );
    }
  });

  it("should return valid segments", async () => {
    connection = await getConnection(KOLOBRZEG, BYDGOSZCZ, 0);
    for (const variant of result) {
      for (const segment of variant.routeVariant.segments) {
        expect(segment).toEqual(
          expect.objectContaining({
            train_nr: expect.any(Number),
            train_name: expect.any(String),
            station_origin: expect.any(Number),
            station_destination: expect.any(Number),
            departure: expect.any(String),
            arrival: expect.any(String),
            available: expect.any(Boolean),
          }),
        );
      }
    }
  });

  it("should have consecutive segments", () => {
    for (const variant of result) {
      for (let i = 1; i < variant.routeVariant.segments.length; i++) {
        expect(variant.routeVariant.segments[i].station_origin).toBe(
          variant.routeVariant.segments[i - 1].station_destination,
        );
      }
    }
  });
});
