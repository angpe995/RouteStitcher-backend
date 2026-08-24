jest.mock("../../services/pkpApi");
jest.mock("../../services/trainService");
jest.mock("../../services/availabilityService");
const trainService = require("../../services/trainService");
const availabilityService = require("../../services/availabilityService");
const api = require("../../services/pkpApi");
const availabilityPlanner = require("../../services/availabilityPlanner");
const connections = require("../fixtures/fullConnection.json");
const connection = connections[0];
jest.setTimeout(30000);

beforeEach(() => {
  availabilityService.getConnectionId.mockResolvedValue(12345678);
  trainService.getTariffids.mockResolvedValue([1234]);
  trainService.getPlaceTypes.mockResolvedValue([
    {
      train_nr: 170095427,
      place_types: [
        {
          id: 4,
          name: "Klasa 1",
          price: 47.58,
          available: false,
          selected: false,
          uncertain: false,
          capacity: 6,
          reservation_modes: {
            seat_map: true,
            preferences: {
              available: true,
              compartment_types: [],
            },
          },
        },
        {
          id: 5,
          name: "Klasa 2",
          price: 47.58,
          available: true,
          selected: false,
          uncertain: false,
          capacity: 6,
          reservation_modes: {
            seat_map: true,
            preferences: {
              available: true,
              compartment_types: [],
            },
          },
        },
      ],
    },
    {
      train_nr: 170095293,
      place_types: [
        {
          id: 4,
          name: "Klasa 1",
          price: 47.58,
          available: false,
          selected: false,
          uncertain: false,
          capacity: 6,
          reservation_modes: {
            seat_map: true,
            preferences: {
              available: true,
              compartment_types: [],
            },
          },
        },
        {
          id: 5,
          name: "Klasa 2",
          price: 47.58,
          available: true,
          selected: false,
          uncertain: false,
          capacity: 6,
          reservation_modes: {
            seat_map: true,
            preferences: {
              available: true,
              compartment_types: [],
            },
          },
        },
      ],
    },
  ]);
  availabilityService.checkTrainAvailability.mockResolvedValue({
    place_types: [
      {
        id: 5,
        seats: [
          {
            carriage_nr: "3",
            seat_nr: "96",
            special_compartment_type_id: 7,
            state: "FREE",
            placement_id: 1,
          },
        ],
        available: true,
      },
    ],
  });
});
afterEach(() => {
  jest.clearAllMocks();
});
it("should return train availability", async () => {
  const result = await availabilityPlanner.checkAvailability(connection);
  expect(result).toHaveLength(2);
  for (const train of result) {
    expect(train).toEqual(
      expect.objectContaining({
        train_nr: expect.any(Number),
        place_types: expect.any(Array),
      }),
    );
     for (const placeType of train.place_types) {
      expect(placeType).toEqual(
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
