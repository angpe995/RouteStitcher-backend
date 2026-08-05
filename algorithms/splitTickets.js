const generateCutPoints = (stationCount, tickets = 3) => {
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

const splitTickets = (leg, options) => {
  const result = [];
  const cutPoints = generateCutPoints(leg.stops_in_leg.length);
  cutPoints.sort((a, b) => a.length - b.length);
  for (const CutPoint of cutPoints) {
    const conn = [];
    let prev = leg.stops_in_leg[0].station_id;
    let index = 0;
    for (const point of CutPoint) {
      conn.push({
        train_nr: leg.train_nr,
        station_origin: prev,
        station_destination: leg.stops_in_leg[point].station_id,
        arrival: leg.stops_in_leg[point].arrival,
        departure: leg.stops_in_leg[point].departure,
      });
      prev = leg.stops_in_leg[point].station_id;
      index = point;
    }
    if (index != leg.stops_in_leg.length - 1) {
      conn.push({
        train_nr: leg.train_nr,
        station_origin: prev,
        station_destination:
          leg.stops_in_leg[leg.stops_in_leg.length - 1].station_id,
        arrival: leg.stops_in_leg[leg.stops_in_leg.length - 1].arrival,
        departure: leg.stops_in_leg[leg.stops_in_leg.length - 1].departure,
      });
    }

    result.push(conn);
  }
  return result;
};
module.exports = {
  splitTickets,
  generateCutPoints,
};
