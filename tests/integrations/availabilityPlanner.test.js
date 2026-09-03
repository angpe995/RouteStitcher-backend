const trainService = require("../../services/trainService");
const availabilityService = require("../../services/availabilityService");
const api = require("../../services/pkpApi");
const availabilityPlanner = require("../../services/availabilityPlanner");

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year}T${hour}:${minutes}:00`;
}
jest.setTimeout(30000);
const KATOWICE = 73312;
const LODZ = 46706;
const KUTNO = 32201;
const GDANSK = 7500;
const KRAKOW = 80416;
const ZGIERZ = 46707;
const BYDGOSZCZ = 18408;
const CHELM = 50906;
const WARSZAWA = 33605;
const getConnection = async (start, end, changes) => {
  const date = formatDate(new Date());
  try {
    const result = await trainService.getConnections(date, start, end);
    for (const conn of result) {
      if (conn.changes !== changes) {
        continue;
      }
      return conn;
    }
  } catch (err) {
    console.error("Failed to get Connection", err.message);
    throw err;
  }
};

it("should return train availability", async () => {
  const connection = await getConnection(LODZ, GDANSK, 1);
  const result = await availabilityPlanner.checkAvailability(connection);
  expect(result).toEqual(expect.any(Array));
  expect(result.length).toBeGreaterThan(1);
  for (const train of result) {
    expect(train).toEqual(
      expect.objectContaining({
        train_nr: expect.any(Number),
        place_types: expect.any(Array),
      }),
    );
    for (const placeTypeTrain of train.place_types) {
      console.log("placeTypeTrain:", placeTypeTrain);
      console.log("place_types:", placeTypeTrain.place_types);
      console.log("is array:", Array.isArray(placeTypeTrain.place_types));
      expect(placeTypeTrain).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          available: expect.any(Boolean),
          seats: expect.any(Array),
          seat_selection_available: expect.any(Boolean),
          reservation_modes: expect.any(Object),
        }),
      );
    }
  }
});
