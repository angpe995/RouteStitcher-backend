const canCreateSegment = (origin, destination) =>
  origin.for_boarding && destination.for_alighting;
const generateCutPoints = (stationCount, tickets) => {
  const result = [];
  function backtracking(result, current, max_len, cutPointCount) {
    if (current.length >= max_len) {
      return;
    }
    let start_value = 1;
    if (current.length > 0) {
      start_value = current[current.length - 1] + 1;
    }
    for (let i = start_value; i <= cutPointCount; i++) {
      current.push(i);
      result.push([...current]);
      backtracking(result, current, max_len, cutPointCount);
      current.pop();
    }
  }
  backtracking(result, [], tickets - 1, stationCount - 1);
  return result;
};

const splitTickets = (leg, tickets = 3) => {
  const result = [];
  const cutPoints = generateCutPoints(leg.stops_in_leg.length,tickets);
  cutPoints.sort((a, b) => {
    if (a.length !== b.length) {
      return a.length - b.length;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return b[i] - a[i];
      }
    }
    return 0;
  });
  for (const CutPoint of cutPoints) {
    const conn = [];
    let prev = leg.stops_in_leg[0];
    let index = 0;
    for (const point of CutPoint) {
      const origin = prev;
      const destination = leg.stops_in_leg[point];
      if (canCreateSegment(origin, destination)) {
        conn.push({
          train_nr: leg.train_nr,
          train_name: leg.train_name,
          brand_id: leg.commercial_brand_id,
          origin_station_id: origin.station_id,
          destination_station_id: destination.station_id,
          departure: origin.departure,
          arrival: destination.arrival,
        });
      }

      prev = destination;
      index = point;
    }
    if (index != leg.stops_in_leg.length - 1) {
      const origin = prev;
      const destination = leg.stops_in_leg[leg.stops_in_leg.length - 1];

      if (canCreateSegment(origin, destination)) {
        conn.push({
          train_nr: leg.train_nr,
          train_name: leg.train_name,
          brand_id: leg.commercial_brand_id,
          origin_station_id: origin.station_id,
          destination_station_id: destination.station_id,
          departure: origin.departure,
          arrival: destination.arrival,
        });
      }
    }

    result.push(conn);
  }
  return result;
};
module.exports = {
  splitTickets,
  generateCutPoints,
};
