import { expect, test } from "bun:test";

// can be disable for performance
const enableSafeGuards = true;

const renderTestNum = (e: any) =>
  typeof e === "bigint" || typeof e === "number"
    ? (() => {
        const ending = typeof e === "bigint" ? "n" : "";
        return e + ending + ` \\* 0b` + e.toString(2) + ending + ` *\\`;
      })()
    : e;

const customTest =
  <TArgs extends Array<any>, TReturn>(func: (...args: TArgs) => TReturn) =>
  (expected: TReturn, ...args: TArgs) =>
    test(
      func.name +
        `(` +
        args.map((e) => renderTestNum(e)).join(", ") +
        `) === ` +
        renderTestNum(expected),
      () => expect(func(...args)).toBe(expected)
    );

// TODO: check will it instead of manual bringing it to 8n work stable with inexact power of 2, like when assumedBigintSizeInBits === 5n

export const countBigintLeadingZeros = (
  bitSequence: bigint,
  powerOf2ToGetAssumedBigIntSize: bigint = 5n
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

// prettier-ignore
([
  { expected: 0n, x: 0b1n,        powerOf2ToGetAssumedBigIntSize: 0n /* (2 ** 0n === 1n, which is the closest highest to 1 bit of length) */ },
  { expected: 7n, x: 0b00000001n, powerOf2ToGetAssumedBigIntSize: 3n /* (2 ** 3n === 8n, which is the closest highest above 5 bits) */ },
  { expected: 5n, x: 0b00000101n, powerOf2ToGetAssumedBigIntSize: 3n /* (2 ** 3n === 8n, which is the closest highest above 5 bits) */ },
] as const).forEach(
  _ => customTest(countBigintLeadingZeros)(_.expected, _.x, _.powerOf2ToGetAssumedBigIntSize)
);

export const countBigintUsedBits = (
  bitSequence: bigint,
  powerOf2ToGetAssumedBigIntSize: bigint = 64n
  // alphabet: string
) =>
  2n ** powerOf2ToGetAssumedBigIntSize -
  countBigintLeadingZeros(bitSequence, powerOf2ToGetAssumedBigIntSize);

// prettier-ignore
([
  { expected: 1n, x: 0b1n,     powerOf2ToGetAssumedBigIntSize: 0n /* (2 ** 0n === 1n, which is the closest highest to 1 bit of length) */ },
  { expected: 1n, x: 0b00001n, powerOf2ToGetAssumedBigIntSize: 3n /* (2 ** 3n === 8n, which is the closest highest above 5 bits) */ },
  { expected: 3n, x: 0b00101n, powerOf2ToGetAssumedBigIntSize: 3n /* (2 ** 3n === 8n, which is the closest highest above 5 bits) */ },
] as const).forEach(
  _ => customTest(countBigintUsedBits)(_.expected, _.x, _.powerOf2ToGetAssumedBigIntSize)
);

const getBigintSlotFromRight = (
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

// prettier-ignore
([
  { expected: 0b1n,   x: 0b1n,           slotIndex: 0n, slotSizeInBits: 1n },
  { expected: 0b1n,   x: 0b1_0n,         slotIndex: 1n, slotSizeInBits: 1n },
  { expected: 0b01n,  x: 0b01_10n,       slotIndex: 1n, slotSizeInBits: 2n },
  { expected: 0b01n,  x: 0b01_10n,       slotIndex: 1n, slotSizeInBits: 2n },
  { expected: 0b101n, x: 0b101_000_110n, slotIndex: 2n, slotSizeInBits: 3n },
  { expected: 0b000n, x: 0b101_000_110n, slotIndex: 1n, slotSizeInBits: 3n },
  { expected: 0b110n, x: 0b101_000_110n, slotIndex: 0n, slotSizeInBits: 3n },
] as const).forEach(
  _ => customTest(getBigintSlotFromRight)(_.expected, _.x, _.slotIndex, _.slotSizeInBits)
);

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

// prettier-ignore
([
  { expected: 0b1n,   x: 0b1n, slotIndex: 0n, slotSizeInBits: 1n, assumedBigintSizeInBits: 1n },

  { expected: 0b1n,   x: 0b0_0_0_0_0_0_0_0_1n, slotIndex: 8n, slotSizeInBits: 1n, assumedBigintSizeInBits: 9n },
  { expected: 0b1n,   x: 0b0_0_0_0_0_0_0_1_0n, slotIndex: 7n, slotSizeInBits: 1n, assumedBigintSizeInBits: 9n },

  { expected: 0b01n,  x: 0b00_00_00_01_10n, slotIndex: 3n, slotSizeInBits: 2n, assumedBigintSizeInBits: 10n },
  { expected: 0b01n,  x: 0b00_00_00_01_10n, slotIndex: 3n, slotSizeInBits: 2n, assumedBigintSizeInBits: 10n },

  { expected: 0b101n, x: 0b101_000_110n, slotIndex: 0n, slotSizeInBits: 3n, assumedBigintSizeInBits: 9n },
  { expected: 0b000n, x: 0b101_000_110n, slotIndex: 1n, slotSizeInBits: 3n, assumedBigintSizeInBits: 9n },
  { expected: 0b110n, x: 0b101_000_110n, slotIndex: 2n, slotSizeInBits: 3n, assumedBigintSizeInBits: 9n },
] as const).forEach(
  _ => customTest(getBigintSlotFromLeft)(_.expected, _.x, _.slotIndex, _.slotSizeInBits, _.assumedBigintSizeInBits)
);

export function* genBigints(amountOfSlots: bigint, highestValueInSlot: bigint) {
  const bitsPerSlot: bigint =
    countBigintUsedBits(highestValueInSlot); /* highestValueInSlot */

  function* genBigintsInner(
    slotsLeft: bigint,

    bitsPrefix: bigint = 0n
  ): Generator<bigint, void, unknown> {
    if (slotsLeft) {
      for (let i = 0n; i <= highestValueInSlot; i++) {
        yield* genBigintsInner(slotsLeft - 1n, (bitsPrefix << bitsPerSlot) + i);
      }
    } else yield bitsPrefix;
  }
  yield* genBigintsInner(amountOfSlots);
}

// export function* getAllStringCombinations(
//   stringLength: number,
//   alphabet: string,

//   stringPrefix: string = ""
// ): Generator<string, void, unknown> {
//   if (stringLength)
//     for (const char of alphabet) {
//       yield* getAllStringCombinations(
//         stringLength - 1,
//         alphabet,
//         stringPrefix + char
//       );
//     }
//   else yield stringPrefix;
// }
