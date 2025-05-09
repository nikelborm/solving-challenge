// can be disable for performance
const enableSafeGuards = true;

// TODO: check will it instead of manual bringing it to 8n work stable with
// inexact power of 2, like when assumedBigintSizeInBits === 5n
export const countBigintLeadingZeros = (
  bitSequence: bigint,
  /* Required to be power of 2 because this function uses binary search to count leading zeros */
  powerOf2ToGetAssumedBigIntSize: bigint = 6n
) => {
  const assumedBigintSizeInBits = 1n << powerOf2ToGetAssumedBigIntSize;

  if (enableSafeGuards) {
    const maxBitSequenceValue = (1n << assumedBigintSizeInBits) - 1n;

    // TODO обновить проверку с учётом того что в каждом слоте может быть не
    // больше максимального значения для слота, а не просто 1111
    if (bitSequence > maxBitSequenceValue)
      throw new Error(
        "Bit sequence cannot be greater than assumed bigint size in bits"
      );

    if (assumedBigintSizeInBits <= 0n)
      throw new Error("Assumed bigint size in bits should be greater than 0!");

    if (bitSequence < 0n)
      throw new Error("Negative bit sequences are not supported");
  }

  // Adapted version of https://stackoverflow.com/a/23857066
  // let n = 1n << (assumedBigintSizeInBits - 1n);
  let n = assumedBigintSizeInBits;
  let y = 0n;

  for (
    var shifter = assumedBigintSizeInBits / 2n;
    shifter > 1n;
    shifter >>= 1n
  ) {
    y = bitSequence >> shifter;
    if (y !== 0n) {
      n = n - shifter;
      bitSequence = y;
    }
  }

  y = bitSequence >> 0b00001n;

  return n - (y !== 0n ? 0b00010n : bitSequence);
};

export const countBigintUsedBits = (
  bitSequence: bigint,
  /* Required to be power of 2 because this function uses binary search to count leading zeros */
  powerOf2ToGetAssumedBigIntSize: bigint = 6n
) =>
  (1n << powerOf2ToGetAssumedBigIntSize) -
  countBigintLeadingZeros(bitSequence, powerOf2ToGetAssumedBigIntSize);

export const cutOutSlotsOfBitSequence = (
  bitSequence: bigint,
  amountOfSlotsToCutOut: bigint,
  slotSizeInBits: bigint
) => {
  if (enableSafeGuards) {
    if (slotSizeInBits <= 0n)
      throw new Error("Slot size in bits should be greater than 0!");

    if (amountOfSlotsToCutOut <= 0n)
      throw new Error("slotsToCutOut should be greater than 0!");

    if (bitSequence < 0n)
      throw new Error("Negative bit sequences are not supported");
  }

  const bitSequenceMaskFilledWithOnesToRemoveRemainsOnTheLeft =
    (1n << (amountOfSlotsToCutOut * slotSizeInBits)) - 1n;

  return (amountOfSlotsSkippedFromTheRight: bigint) => {
    if (enableSafeGuards) {
      if (amountOfSlotsSkippedFromTheRight < 0n)
        throw new Error(
          "Amount of slots skipped from the right should not be less than 0!"
        );
    }

    return (
      (bitSequence >> (amountOfSlotsSkippedFromTheRight * slotSizeInBits)) &
      bitSequenceMaskFilledWithOnesToRemoveRemainsOnTheLeft
    );
  };
};

export const getBigintSlotFromRight = (
  bitSequence: bigint,
  slotSizeInBits: bigint
) => cutOutSlotsOfBitSequence(bitSequence, 1n, slotSizeInBits);

export const getBigintSlotFromLeft = (
  bitSequence: bigint,
  slotIndexCountingFromLeft: bigint,
  slotSizeInBits: bigint,
  assumedBigintSizeInBits: bigint
) => {
  const maxSlotIndex = assumedBigintSizeInBits / slotSizeInBits - 1n;

  const slotIndexCountingFromRight = maxSlotIndex - slotIndexCountingFromLeft;

  if (enableSafeGuards) {
    if (assumedBigintSizeInBits % slotSizeInBits !== 0n)
      throw new Error(
        "Assumed bigint size in bits should be a multiple of slot size"
      );

    if (slotIndexCountingFromRight < 0n)
      throw new Error("Slot index from right should not be less than 0!");

    if (slotIndexCountingFromRight > maxSlotIndex)
      throw new Error(
        "Slot index from right should be less than maxSlotIndex!"
      );

    if (slotIndexCountingFromLeft < 0n)
      throw new Error("Slot index from left should not be less than 0!");

    if (slotIndexCountingFromLeft > maxSlotIndex)
      throw new Error("Slot index from left should be less than maxSlotIndex!");
  }

  return getBigintSlotFromRight(
    bitSequence,
    slotSizeInBits
  )(slotIndexCountingFromRight);
};

export function* genBigints(
  amountOfSlots: bigint,
  highestValueInSlot: bigint,
  powerOf2ToGetAssumedBigIntSize: bigint = 6n
) {
  if (enableSafeGuards) {
    if (amountOfSlots <= 0n)
      throw new Error("Amount of slots should be greater than 0!");

    if (highestValueInSlot <= 0n)
      throw new Error("Highest value in slot should be greater than 0!");
  }

  const slotSizeInBits = countBigintUsedBits(
    highestValueInSlot,
    powerOf2ToGetAssumedBigIntSize
  );

  function* genBigintsInner(
    slotsLeft: bigint,

    bitsPrefix: bigint = 0n
  ): Generator<bigint, void, unknown> {
    if (slotsLeft)
      for (
        let currentSlotValue = 0n;
        currentSlotValue <= highestValueInSlot;
        currentSlotValue++
      )
        yield* genBigintsInner(
          slotsLeft - 1n,
          (bitsPrefix << slotSizeInBits) + currentSlotValue
        );
    else yield bitsPrefix;
  }

  yield* genBigintsInner(amountOfSlots);
}

export const getBigintWithUpdatedSlotCountingFromRight = (
  bitSequence: bigint,
  slotIndexCountingFromRight: bigint,
  highestValueInSlot: bigint,
  newSlotContent: bigint
) => {
  const slotSizeInBits = countBigintUsedBits(highestValueInSlot);

  if (enableSafeGuards) {
    if (bitSequence < 0n)
      throw new Error("Negative bit sequences are not supported");

    if (slotSizeInBits <= 0n)
      throw new Error("Slot size in bits should be greater than 0!");

    if (slotIndexCountingFromRight < 0n)
      throw new Error("Slot index should not be less than 0!");

    if (newSlotContent > highestValueInSlot)
      throw new Error("Overflowing slots is not allowed!");

    if (newSlotContent < 0n)
      throw new Error("Negative values in slots are not allowed!");

    if (highestValueInSlot <= 0n)
      throw new Error("Highest value in slot should be greater than 0!");
  }

  const bitsToShiftToReachProperSlot =
    slotIndexCountingFromRight * slotSizeInBits;

  const targetSlotFilledWithOnesAndEverythingElseEmpty =
    ((1n << slotSizeInBits) - 1n) << bitsToShiftToReachProperSlot;

  const bitSequenceWithEmptyTargetSlot =
    bitSequence & ~targetSlotFilledWithOnesAndEverythingElseEmpty;

  const newSlotContentShiftedIntoProperSlotWithEmptyOthers =
    newSlotContent << bitsToShiftToReachProperSlot;

  return (
    bitSequenceWithEmptyTargetSlot |
    newSlotContentShiftedIntoProperSlotWithEmptyOthers
  );
};

export const isBitSequenceContainsAnotherBitSequence = (
  superBitSequence: bigint,
  subBitSequence: bigint,
  slotSizeInBits: bigint,
  sizeOfSuperBitSequenceInSlots: bigint,
  sizeOfSubBitSequenceInSlots: bigint
) => {
  if (enableSafeGuards) {
    if (superBitSequence < 0n || subBitSequence < 0n)
      throw new Error("Negative bit sequences are not supported");

    if (
      sizeOfSuperBitSequenceInSlots <= 0n ||
      sizeOfSubBitSequenceInSlots <= 0n
    )
      throw new Error("Bit sequence sizes cannot be less than 1 slot");

    const maxSuperBitSequenceValue =
      (1n << (sizeOfSuperBitSequenceInSlots * slotSizeInBits)) - 1n;

    // TODO обновить проверку с учётом того что в каждом слоте может быть не
    // больше максимального значения для слота, а не просто 1111
    if (superBitSequence > maxSuperBitSequenceValue)
      throw new Error(
        "superBitSequence cannot be larger than according maximum possible value based on slot size"
      );

    const maxSubBitSequenceValue =
      (1n << (sizeOfSubBitSequenceInSlots * slotSizeInBits)) - 1n;

    // TODO обновить проверку с учётом того что в каждом слоте может быть не
    // больше максимального значения для слота, а не просто 1111
    if (subBitSequence > maxSubBitSequenceValue)
      throw new Error(
        "subBitSequence cannot be larger than according maximum possible value based on slot size"
      );

    if (sizeOfSubBitSequenceInSlots > sizeOfSuperBitSequenceInSlots)
      throw new Error(
        "subBitSequenceSizeInSlots cannot be larger than superBitSequenceSizeInSlots"
      );
  }

  const maxSlotsToShift =
    sizeOfSuperBitSequenceInSlots - sizeOfSubBitSequenceInSlots;

  const cutOutFewSlotsOfSuperBitSequence = cutOutSlotsOfBitSequence(
    superBitSequence,
    sizeOfSubBitSequenceInSlots,
    slotSizeInBits
  );

  for (
    let amountOfSlotsSkippedFromTheRight = 0n;
    amountOfSlotsSkippedFromTheRight <= maxSlotsToShift;
    amountOfSlotsSkippedFromTheRight++
  )
    if (
      cutOutFewSlotsOfSuperBitSequence(amountOfSlotsSkippedFromTheRight) ===
      subBitSequence
    )
      return true;

  return false;
};

export const isBitSequenceContainsAnotherBitSequenceWithCustomSlotComparison = (
  superBitSequence: bigint,
  subBitSequence: bigint,
  slotSizeInBits: bigint,
  sizeOfSuperBitSequenceInSlots: bigint,
  sizeOfSubBitSequenceInSlots: bigint,
  areSlotsEqual: (a: bigint, b: bigint) => boolean = (a, b) => a === b
) => {
  if (enableSafeGuards) {
    if (superBitSequence < 0n || subBitSequence < 0n)
      throw new Error("Negative bit sequences are not supported");

    if (
      sizeOfSuperBitSequenceInSlots <= 0n ||
      sizeOfSubBitSequenceInSlots <= 0n
    )
      throw new Error("Bit sequence sizes cannot be less than 1 slot");

    const maxSuperBitSequenceValue =
      (1n << (sizeOfSuperBitSequenceInSlots * slotSizeInBits)) - 1n;

    // TODO обновить проверку с учётом того что в каждом слоте может быть не
    // больше максимального значения для слота, а не просто 1111
    if (superBitSequence > maxSuperBitSequenceValue)
      throw new Error(
        "superBitSequence cannot be larger than according maximum possible value based on slot size"
      );

    const maxSubBitSequenceValue =
      (1n << (sizeOfSubBitSequenceInSlots * slotSizeInBits)) - 1n;

    // TODO обновить проверку с учётом того что в каждом слоте может быть не
    // больше максимального значения для слота, а не просто 1111
    if (subBitSequence > maxSubBitSequenceValue)
      throw new Error(
        "subBitSequence cannot be larger than according maximum possible value based on slot size"
      );

    if (sizeOfSubBitSequenceInSlots > sizeOfSuperBitSequenceInSlots)
      throw new Error(
        "subBitSequenceSizeInSlots cannot be larger than superBitSequenceSizeInSlots"
      );
  }

  const maxSlotsToShift =
    sizeOfSuperBitSequenceInSlots - sizeOfSubBitSequenceInSlots;

  const getBigintSlotFromRightOfSuperBitSequence = getBigintSlotFromRight(
    superBitSequence,
    slotSizeInBits
  );

  const getBigintSlotFromRightOfSubBitSequence = getBigintSlotFromRight(
    subBitSequence,
    slotSizeInBits
  );

  fittingSubStringLoop: for (
    let amountOfSlotsSkippedFromTheRight = 0n;
    amountOfSlotsSkippedFromTheRight <= maxSlotsToShift;
    amountOfSlotsSkippedFromTheRight++
  ) {
    for (
      let slotIndexOfSubBitSequence = 0n;
      slotIndexOfSubBitSequence < sizeOfSubBitSequenceInSlots;
      slotIndexOfSubBitSequence++
    )
      if (
        !areSlotsEqual(
          getBigintSlotFromRightOfSuperBitSequence(
            amountOfSlotsSkippedFromTheRight + slotIndexOfSubBitSequence
          ),
          getBigintSlotFromRightOfSubBitSequence(slotIndexOfSubBitSequence)
        )
      )
        continue fittingSubStringLoop;

    return true;
  }

  return false;
};
