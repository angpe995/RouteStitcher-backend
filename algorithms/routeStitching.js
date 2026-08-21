const trainService = require("../services/trainService");
const availabilityPlaner = require("../services/availabilityPlanner");
const splitTickets = require("./splitTickets");
const MIN_COVERAGE = 0.4;
const MAX_COVERAGE = 1;
const findMatchingConnection = (connections, segment) =>
  connections.find(
    (connection) =>
      connection.changes === 0 &&
      connection.legs?.some(
        (leg) =>
          leg.train_name === segment.train_name &&
          leg.origin_station_id === segment.station_origin &&
          leg.destination_station_id === segment.station_destination,
      ),
  );
const getTrainLeg = (connection, trainNr) =>
  connection.legs.find(
    (leg) => leg.leg_type === "train_leg" && leg.train_nr === trainNr,
  );
const validateVariant = async (
  variant,
  availabilityCache = new Map(),
  connectionCache = new Map(),
  placeClass = 5,
) => {
  const evaluatedSegments = [];
  let coveredDuration = 0;
  let totalDuration = 0;
  for (const leg of variant) {
    const keyConnection = `${leg.departure}-${leg.station_origin}-${leg.station_destination}`;
    let connection;
    if (connectionCache.has(keyConnection))
      connection = connectionCache.get(keyConnection);
    else {
      const connections = await trainService.getConnections(
        leg.departure,
        leg.station_origin,
        leg.station_destination,
      );
      connection = findMatchingConnection(connections, leg);
      if (!connection) {
        evaluatedSegments.push({
          ...leg,
          available: false,
        });
        totalDuration += 0;
        continue;
      }
      connectionCache.set(keyConnection, connection);
    }

    let checkWhole;
    const availabilityKey = connection.uuid;
    if (availabilityCache.has(availabilityKey)) {
      checkWhole = availabilityCache.get(availabilityKey);
    } else {
      checkWhole = await availabilityPlaner.checkAvailability(connection);
      if (!checkWhole || checkWhole.length === 0) {
        return [];
      }
      availabilityCache.set(availabilityKey, checkWhole);
    }

    const isAvailable = checkWhole.every((train) =>
      train.place_types.some(
        (placeType) =>
          placeType.id === placeClass &&
          placeType.available &&
          placeType.seats?.some(
            (seat) =>
              seat.state === "FREE" &&
              seat.special_compartment_type_id === null,
          ),
      ),
    );
    evaluatedSegments.push({
      ...leg,
      available: isAvailable,
    });
    if (isAvailable) {
      coveredDuration += connection.legs[0].duration;
    }
    totalDuration += connection.legs[0].duration;
  }
  return {
    segments: evaluatedSegments,
    coveredDuration,
    coverage: coveredDuration / totalDuration,
  };
};

const findBestVariant = async (
  trainLeg,
  availabilityCache,
  connectionCache,
  tickets,
) => {
  const variants = splitTickets.splitTickets(trainLeg, tickets);
  let bestVariant = null;
  let minCovarage = 0;
  for (const variant of variants) {
    const validatedVariant = await validateVariant(
      variant,
      availabilityCache,
      connectionCache,
    );
    if (validatedVariant.coverage >= minCovarage) {
      bestVariant = validatedVariant;
      if (validatedVariant.coverage === MAX_COVERAGE) {
        break;
      }
      minCovarage = validatedVariant.coverage;
    }
  }
  return bestVariant;
};
const routeStitcher = async (connection, tickets = 3) => {
  const connectionCache = new Map();
  const availabilityCache = new Map();
  const checkWhole = await availabilityPlaner.checkAvailability(connection);
  if (!checkWhole) {
    return [];
  }
  const availableVariants = [];
  for (const train of checkWhole) {
    const trainLeg = getTrainLeg(connection, train.train_nr);
    if (!trainLeg) {
      continue;
    }
    let bestVariant;
    for (let i = 2; i <= tickets; i++) {
      bestVariant = await findBestVariant(
        trainLeg,
        availabilityCache,
        connectionCache,
        i,
      );
      if (bestVariant && bestVariant.coverage === MAX_COVERAGE) {
        break;
      }
    }
    if (bestVariant && bestVariant.coverage >= MIN_COVERAGE) {
      availableVariants.push(bestVariant);
    } else {
      availableVariants.push({
        segments: [],
        coveredDuration: 0,
        coverage: 0,
      });
    }
  }
  console.log(availableVariants);
  return availableVariants;
};
module.exports = {
  routeStitcher,
  validateVariant,
};
