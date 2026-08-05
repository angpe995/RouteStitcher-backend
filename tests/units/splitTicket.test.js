const splitter = require("../../algorithms/splitTickets");
const connections = require("../fixtures/fullConnection.json");
const connection = connections[0];
describe("splitTickets", () => {
  it("should return an array", () => {
    const result = splitter.splitTickets(connection.legs[0]);

    expect(Array.isArray(result)).toBe(true);
  });
  it("should generate at least one ticket split", () => {
    const result = splitter.splitTickets(connection.legs[0]);
    expect(result.length).toBeGreaterThan(0);
  });
  it("should return only arrays of tickets", () => {
    const result = splitter.splitTickets(connection.legs[0]);
    expect(result.every((variant) => Array.isArray(variant))).toBe(true);
  });

  it("should not generate more than 3 tickets in a variant", () => {
    const result = splitter.splitTickets(connection.legs[0]);
    expect(result.every((variant) => variant.length <= 3)).toBe(true);
  });
  it("should preserve travel order", () => {
    const result = splitter.splitTickets(connection.legs[0]);
    result.forEach((variant) => {
      for (let i = 1; i < variant.length; i++) {
        expect(variant[i].station_origin).toBe(
          variant[i - 1].station_destination,
        );
      }
    });
  });

  it("should return valid ticket objects", () => {
    const result = splitter.splitTickets(connection.legs[0]);
    result.forEach((variant) => {
      variant.forEach((ticket) => {
        expect(ticket).toEqual(
          expect.objectContaining({
            train_nr: expect.any(Number),
            station_origin: expect.any(Number),
            station_destination: expect.any(Number),
          }),
        );
      });
    });
  });
});
describe("generateCutPoints", () => {
  it("should generate all cut point combinations for 4 stations and max 3 tickets", () => {
    const result = splitter.generateCutPoints(4, 3);
    expect(result).toHaveLength(6);
  });

  it("should generate all cut point combinations for 5 stations and max 3 tickets", () => {
    const result = splitter.generateCutPoints(5, 3);
    expect(result).toHaveLength(10);
  });

  it("should generate all cut point combinations for 7 stations and max 3 tickets", () => {
    const result = splitter.generateCutPoints(7, 3);
    expect(result).toHaveLength(21);
  });
});
