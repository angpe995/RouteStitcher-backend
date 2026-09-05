const trainService = require("../services/trainService");
const availabilityPlaner = require("../services/availabilityPlanner");
const splitTickets = require("./splitTickets");
const MIN_COVERAGE = 0.4;
const MAX_COVERAGE = 1;
const selectPlaceClass = (placeTypes, requestedClass) => {
  if (requestedClass) {
    const requested = placeTypes.find(
      (placeType) => placeType.id === requestedClass,
    );

    if (!requested) {
      //console.log(placeTypes);
      return placeTypes.find((placeType) => placeType.available);
    }

    if (!requested.available) {
      return null;
    }

    return requested;
  }

  return placeTypes.find((placeType) => placeType.available);
};
const findMatchingConnection = (connections, segment) =>
  connections.find(
    (connection) =>
      connection.changes === 0 &&
      connection.legs?.some(
        (leg) =>
          leg.train_name === segment.train_name &&
          leg.origin_station_id === segment.origin_station_id &&
          leg.destination_station_id === segment.destination_station_id,
      ),
  );

const findConnection = async (
  departure,
  originStationId,
  destinationStationId,
) => {
  const connections = await trainService.getConnections(
    departure,
    originStationId,
    destinationStationId,
  );

  return connections.find((connection) => {
    const trainLegs = connection.legs?.filter(
      (leg) => leg.leg_type === "train_leg",
    );

    if (!trainLegs?.length) {
      return false;
    }

    const firstLeg = trainLegs[0];
    const lastLeg = trainLegs[trainLegs.length - 1];

    return (
      firstLeg.origin_station_id === originStationId &&
      lastLeg.destination_station_id === destinationStationId
    );
  });
};
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
  const newVariant = variant
    .map((item, index) => {
      const durationMs = new Date(item.arrival) - new Date(item.departure);
      const durationMinutes = Math.round(durationMs / 1000 / 60);
      return {
        ...item,
        travelTime: durationMinutes,
        originalIndex: index,
      };
    })
    .sort((a, b) => b.travelTime - a.travelTime);
  const totalDuration = newVariant.reduce(
    (sum, item) => sum + item.travelTime,
    0,
  );

  // console.log("Variant: ", newVariant);
  for (const leg of newVariant) {
    const keyConnection = `${leg.departure}-${leg.origin_station_id}-${leg.destination_station_id}`;
    let connection;
    if (connectionCache.has(keyConnection))
      connection = connectionCache.get(keyConnection);
    else {
      const connections = await trainService.getConnections(
        leg.departure,
        leg.origin_station_id,
        leg.destination_station_id,
      );
      connection = findMatchingConnection(connections, leg);
      if (!connection) {
        evaluatedSegments.push({
          ...leg,
          available: false,
          uuid: connection.uuid,
        });
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
    //console.log(checkWhole[0].place_types);
    const isAvailable = checkWhole.every((train) => {
      const selectedPlaceType = selectPlaceClass(train.place_types, placeClass);
      //console.log("selectedPlaceType", selectedPlaceType);
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
    // console.log(leg);
    evaluatedSegments.push({
      ...leg,
      available: isAvailable,
      uuid: connection.uuid,
    });
    if (isAvailable) {
      coveredDuration += leg.travelTime;
    }
    if (
      !isAvailable &&
      leg.travelTime / totalDuration >= MIN_COVERAGE &&
      leg.travelTime / totalDuration > coveredDuration
    ) {
      break;
    }
  }
  //  console.log("coveredDuration", evaluatedSegments);
  evaluatedSegments.sort((a, b) => a.originalIndex - b.originalIndex);
  return {
    type: "split",
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
    // console.log("Variant:", variant);
    const validatedVariant = await validateVariant(
      variant,
      availabilityCache,
      connectionCache,
      placeClass,
    );
    //console.log(validatedVariant);
    if (validatedVariant.coverage >= minCovarage) {
      bestVariant = validatedVariant;
      if (validatedVariant.coverage === MAX_COVERAGE) {
        break;
      }
      minCovarage = validatedVariant.coverage;
    }
  }
  console.dir(bestVariant, { depth: null });
  return bestVariant;
};
const routeStitcher = async (connection, tickets = 3, placeClass = null) => {
  const connectionCache = new Map();
  const availabilityCache = new Map();
  const checkWhole = await availabilityPlaner.checkAvailability(connection);
  console.log("checkWhole", checkWhole);
  if (!checkWhole || checkWhole.length === 0) {
    const train = connection.legs.find((leg) => leg.leg_type === "train_leg");
    const trainLeg = getTrainLeg(connection, train.train_nr);
    return [
      {
        uuid: connection.uuid,
        train_nr: trainLeg.train_nr,
        train_name: trainLeg.train_name,
        origin_station_id: trainLeg.origin_station_id,
        destination_station_id: trainLeg.destination_station_id,
        departure: trainLeg.departure,
        arrival: trainLeg.arrival,
        routeVariant: {
          brand_id: trainLeg.commercial_brand_id,
          type: "direct",
          segments: [],
          coveredDuration: trainLeg.duration,
          coverage: MAX_COVERAGE,
        },
      },
    ];
  }
  const availableVariants = [];
  for (const train of checkWhole) {
    //train.place_types.map((place_type)=>console.log(place_type.id,":",place_type.seats));
    const trainLeg = getTrainLeg(connection, train.train_nr);
    if (!trainLeg) {
      continue;
    }
    let bestVariant;
    const key = `${trainLeg.departure}-${trainLeg.origin_station_id}-${trainLeg.destination_station_id}-${trainLeg.train_nr}`;

    let LocalConnection;

    if (connectionCache.has(key)) {
      LocalConnection = connectionCache.get(key);
    } else {
      const connections = await trainService.getConnections(
        trainLeg.departure,
        trainLeg.origin_station_id,
        trainLeg.destination_station_id,
      );

      LocalConnection = findMatchingConnection(connections, trainLeg);

      if (LocalConnection) {
        connectionCache.set(key, LocalConnection);
      }
    }
    console.log("LocalConnection", trainLeg.train_name, LocalConnection);
    const checkLocalWhole =
      await availabilityPlaner.checkAvailability(LocalConnection);
    if (!checkLocalWhole || checkLocalWhole.length === 0) {
      availableVariants.push({
        uuid: connection.uuid,
        train_nr: trainLeg.train_nr,
        train_name: trainLeg.train_name,
        origin_station_id: trainLeg.origin_station_id,
        destination_station_id: trainLeg.destination_station_id,
        departure: trainLeg.departure,
        arrival: trainLeg.arrival,
        routeVariant: {
          brand_id: trainLeg.commercial_brand_id,
          type: "direct",
          segments: [],
          coveredDuration: trainLeg.duration,
          coverage: MAX_COVERAGE,
        },
      });
      continue;
    }
    //console.log("checkLocalWhole", checkLocalWhole[0].place_types);
    const selectedPlaceType = selectPlaceClass(
      checkLocalWhole[0].place_types,
      placeClass,
    );

    //  console.log("AAAAAAAA", selectedPlaceType);
    if (
      selectedPlaceType &&
      (selectedPlaceType.seats.length === 0 ||
        selectedPlaceType.seats?.some(
          (seat) => seat.special_compartment_type_id == null,
        ))
    ) {
      console.log("BBBBBBBBBB");
      availableVariants.push({
        uuid: connection.uuid,
        train_nr: trainLeg.train_nr,
        train_name: trainLeg.train_name,
        origin_station_id: trainLeg.origin_station_id,
        destination_station_id: trainLeg.destination_station_id,
        departure: trainLeg.departure,
        arrival: trainLeg.arrival,
        routeVariant: {
          brand_id: trainLeg.commercial_brand_id,
          type: "direct",
          segments: [],
          coveredDuration: trainLeg.duration,
          coverage: MAX_COVERAGE,
        },
      });
    } else {
      console.log("CCCCCCCCCC");
      for (let i = 2; i <= tickets; i++) {
        bestVariant = await findBestVariant(
          trainLeg,
          availabilityCache,
          connectionCache,
          i,
          placeClass,
        );
        console.log("BEST VAARIANT", trainLeg.train_nr, bestVariant);
        if (bestVariant && bestVariant.coverage === MAX_COVERAGE) {
          break;
        }
      }
      if (bestVariant && bestVariant.coverage >= MIN_COVERAGE) {
        availableVariants.push({
          uuid: connection.uuid,
          train_nr: trainLeg.train_nr,
          train_name: trainLeg.train_name,
          departure: trainLeg.departure,
          arrival: trainLeg.arrival,
          origin_station_id: trainLeg.origin_station_id,
          destination_station_id: trainLeg.destination_station_id,
          routeVariant: bestVariant,
        });
      } else {
        availableVariants.push({
          uuid: connection.uuid,
          train_nr: trainLeg.train_nr,
          train_name: trainLeg.train_name,
          departure: trainLeg.departure,
          arrival: trainLeg.arrival,
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
  // console.log(availableVariants[0].routeVariant.segments);
  console.dir(availableVariants, { depth: null });
  const new_result = await AdaptForUrls(availableVariants);

  return new_result;
};
const assignUuidToRange = (result, start, end, uuid) => {
  for (let i = start; i < end; i++) {
    result[i].uuid = uuid;
  }
};
const AdaptForUrls = async (result) => {
  if (!result || result.length === 0) return result;

  // Шаг 1: Создаем плоский массив всех атомарных сегментов для удобства анализа
  const flatSegments = [];

  result.forEach((block, blockIdx) => {
    if (block.routeVariant.type === "split") {
      block.routeVariant.segments.forEach((seg, segIdx) => {
        flatSegments.push({
          isSplit: true,
          blockIdx,
          segIdx,
          available: seg.available,
          departure: seg.departure,
          origin_station_id: seg.origin_station_id,
          destination_station_id: seg.destination_station_id,
          train_name: seg.train_name,
          ref: seg,
        });
      });
    } else {
      flatSegments.push({
        isSplit: false,
        blockIdx,
        available: block.routeVariant.type !== "standing", // Пример: direct = 'В', standing = 'З'
        departure: block.departure,
        origin_station_id: block.origin_station_id,
        destination_station_id: block.destination_station_id,
        train_name: block.train_name,
        ref: block, // прямая ссылка на объект для мутации
      });
    }
  });

  let currentGroup = [];
  const groupsToFetch = [];

  for (let i = 0; i < flatSegments.length; i++) {
    const current = flatSegments[i];

    if (
      current.available &&
      current.train_name !== flatSegments[i - 1]?.train_name
    ) {
      currentGroup.push(current);
    } else {
      if (currentGroup.length > 0) {
        groupsToFetch.push([...currentGroup]);
        currentGroup = [];
      }
      groupsToFetch.push([current]);
    }
  }
  // Не забываем забрать остаток после цикла
  if (currentGroup.length > 0) {
    groupsToFetch.push(currentGroup);
  }

  // Шаг 3: Асинхронно обрабатываем каждую группу и проставляем UUID
  console.log("Groups to fetch:", groupsToFetch);
  for (const group of groupsToFetch) {
    const first = group[0];
    const last = group[group.length - 1];

    // Если в группе только 'З' сегменты или один сегмент, берем его родной коннекшн
    // Если сегментов 'В' несколько — соединяем начало первого и конец последнего
    const connection = await findConnection(
      first.departure,
      first.origin_station_id,
      last.destination_station_id,
      first.train_name,
    );
    console.log("Connection found for group:", connection);
    // Прописываем полученный UUID во все объекты исходного массива result через ссылки
    group.forEach((item) => {
      item.ref.uuid = connection.uuid;
    });
  }

  return result;
};
module.exports = {
  routeStitcher,
  validateVariant,
};
