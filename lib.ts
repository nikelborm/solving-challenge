// can be disable for performance
const enableSafeGuards = true;

// TODO: check will it instead of manual bringing it to 8n work stable with
// inexact power of 2, like when assumedBigintSizeInBits === 5n
export const countBigintLeadingZeros = (
  bitSequence: bigint,
  /* Required to be power of 2 because this function uses binary search to count leading zeros */
  powerOf2ToGetAssumedBigIntSize: bigint = 6n
) => {
  const assumedBigintSizeInBits = 2n ** powerOf2ToGetAssumedBigIntSize;

  if (enableSafeGuards) {
    //        1n                        0b1
    if (1n << assumedBigintSizeInBits < bitSequence)
      throw new Error(
        "Bit sequence is actually greater than assumedBigintSizeInBits"
      );

    if (assumedBigintSizeInBits < 1n)
      throw new Error("Assumed bigint size in bits should be greater than 0");
  }
  // extended version of https://stackoverflow.com/a/23857066
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
) => {
  return (
    2n ** powerOf2ToGetAssumedBigIntSize -
    countBigintLeadingZeros(bitSequence, powerOf2ToGetAssumedBigIntSize)
  );
};

export const getBigintSlotFromRight = (
  bitSequence: bigint,
  slotIndexCountingFromRight: bigint,
  slotSizeInBits: bigint
) => {
  if (enableSafeGuards) {
    if (slotSizeInBits <= 0n)
      throw new Error("Slot size in bits should be greater than 0!");

    if (slotIndexCountingFromRight < 0n)
      throw new Error("Slot index should not be less than 0!");
  }

  return (
    (bitSequence >> (slotIndexCountingFromRight * slotSizeInBits)) &
    ((1n << slotSizeInBits) - 1n)
  );
};

export const getBigintSlotFromLeft = (
  bitSequence: bigint,
  slotIndexCountingFromLeft: bigint,
  slotSizeInBits: bigint,
  assumedBigintSizeInBits: bigint
) => {
  if (enableSafeGuards) {
    if (assumedBigintSizeInBits % slotSizeInBits !== 0n)
      throw new Error(
        "Assumed bigint size in bits should be a multiple of slot size"
      );

    if (slotIndexCountingFromLeft >= assumedBigintSizeInBits)
      throw new Error(
        "Since slot index starts from zero it cannot be equal to bigint size. Also index couldn't be greater than that size."
      );

    if (slotIndexCountingFromLeft < 0n)
      throw new Error("Slot index should not be less than 0!");
  }

  return getBigintSlotFromRight(
    bitSequence,
    assumedBigintSizeInBits / slotSizeInBits - slotIndexCountingFromLeft - 1n,
    slotSizeInBits
  );
};

export function* genBigints(amountOfSlots: bigint, highestValueInSlot: bigint) {
  if (enableSafeGuards) {
    if (amountOfSlots < 1n)
      throw new Error("Amount of slots should be greater than 0!");
  }

  const slotSizeInBits = countBigintUsedBits(highestValueInSlot);

  function* genBigintsInner(
    slotsLeft: bigint,

    bitsPrefix: bigint = 0n
  ): Generator<bigint, void, unknown> {
    if (slotsLeft)
      for (let i = 0n; i <= highestValueInSlot; i++)
        yield* genBigintsInner(
          slotsLeft - 1n,
          (bitsPrefix << slotSizeInBits) + i
        );
    else yield bitsPrefix;
  }
  yield* genBigintsInner(amountOfSlots);
}

export const withUpdatedSlotCountingFromRight = (
  bitSequence: bigint,
  slotIndexCountingFromRight: bigint,
  highestValueInSlot: bigint,
  newSlotContent: bigint
) => {
  const slotSizeInBits = countBigintUsedBits(highestValueInSlot);

  if (enableSafeGuards) {
    if (slotSizeInBits <= 0n)
      throw new Error("Slot size in bits should be greater than 0!");

    if (slotIndexCountingFromRight < 0n)
      throw new Error("Slot index should not be less than 0!");
  }

  return (
    (bitSequence &
      ~(
        ((1n << slotSizeInBits) - 1n) <<
        (slotIndexCountingFromRight * slotSizeInBits)
      )) |
    (newSlotContent << (slotIndexCountingFromRight * slotSizeInBits))
  );
};
