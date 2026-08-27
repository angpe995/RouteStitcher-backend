const trainService = require("../services/trainService");
const availabilityPlaner = require("../services/availabilityPlanner");
const splitTickets = require("./splitTickets");
const MIN_COVERAGE = 0.4;
const MAX_COVERAGE = 1;
const selectPlaceClass = (placeTypes, requestedClass) => {
  if (requestedClass) {
    const requested = placeTypes.find(
      (placeType) => placeType.id === requestedClass && placeType.available,
    );
    return requested ?? null;
  }
  return placeTypes.find((placeType) => placeType.available) ?? null;
};
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
  placeClass = null,
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
    console.log(checkWhole);
    const isAvailable = checkWhole.every((train) => {
      console.log(train.place_types,placeClass);
      const selectedPlaceType = selectPlaceClass(train.place_types, placeClass);
      //console.log(selectedPlaceType);
      if (!selectedPlaceType) {
        return false;
      }
      if (!selectedPlaceType.seat_selection_available) {
        return selectedPlaceType.available;
      }

      return (
        selectedPlaceType.seats?.some(
          (seat) =>
            seat.state === "FREE" && seat.special_compartment_type_id === null,
        ) ?? false
      );
    });
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
    type: coveredDuration / totalDuration==MAX_COVERAGE?"direct":"split",
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
  placeClass = null,
) => {
  const variants = splitTickets.splitTickets(trainLeg, tickets);
  let bestVariant = null;
  let minCovarage = 0;
  for (const variant of variants) {
//    console.log(variant);
    const validatedVariant = await validateVariant(
      variant,
      availabilityCache,
      connectionCache,
      placeClass,
    );
    if (validatedVariant.coverage >= minCovarage) {
      bestVariant = validatedVariant;
      if (validatedVariant.coverage === MAX_COVERAGE) {
        break;
      }
      minCovarage = validatedVariant.coverage;
    }
  }
//  console.log(bestVariant);
  return bestVariant;
};
const routeStitcher = async (connection, tickets = 3, placeClass = null) => {
  const connectionCache = new Map();
  const availabilityCache = new Map();
  const checkWhole = await availabilityPlaner.checkAvailability(connection);
  if (!checkWhole || checkWhole.length===0) {
    return [];
  }
  const availableVariants = [];
  for (const train of checkWhole) {
    const trainLeg = getTrainLeg(connection, train.train_nr);
    if (!trainLeg) {
      continue;
    }
    let bestVariant;
    const selectedPlaceType = selectPlaceClass(train.place_types, placeClass);
    if (selectedPlaceType) {
      availableVariants.push({
        train_nr: trainLeg.train_nr,
        origin_station_id: trainLeg.origin_station_id,
        destination_station_id: trainLeg.destination_station_id,
        routeVariant: {
          brand_id: trainLeg.commercial_brand_id,
          type: "direct",
          segments: [],
          coveredDuration: trainLeg.duration,
          coverage: MAX_COVERAGE,
        },
      });
    } else {
      for (let i = 2; i <= tickets; i++) {
        bestVariant = await findBestVariant(
          trainLeg,
          availabilityCache,
          connectionCache,
          i,
          placeClass,
        );
        //console.log("BEST VAARIANT",trainLeg.train_nr,bestVariant);
        if (bestVariant && bestVariant.coverage === MAX_COVERAGE) {
          break;
        }
      }
      if (bestVariant && bestVariant.coverage >= MIN_COVERAGE) {
        availableVariants.push({
          train_nr: trainLeg.train_nr,
          origin_station_id: trainLeg.origin_station_id,
          destination_station_id: trainLeg.destination_station_id,
          routeVariant: bestVariant,
        });
      } else {
        availableVariants.push({
          train_nr: trainLeg.train_nr,
          origin_station_id: trainLeg.origin_station_id,
          destination_station_id: trainLeg.destination_station_id,
          routeVariant: {
            brand_id: trainLeg.commercial_brand_id,
            type: "standing",
            segments: [],
            coveredDuration: 0,
            coverage: 0,
          },
        });
      }
    }
  }
  return availableVariants;
};
module.exports = {
  routeStitcher,
  validateVariant,
};
