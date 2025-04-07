import { expect, test } from "bun:test";
import { color } from "bun" with { type: "macro" };

// can be disable for performance
const enableSafeGuards = true;

const renderTestNum = (e: any, pad?: { binary?: number; decimal?: number }) =>
  typeof e === "bigint" || typeof e === "number"
    ? ((ending) =>
        color("rgb(209, 167, 0)", "ansi") +
      e.toString(10).padStart(pad?.decimal ?? 1, " ") +
        color("rgb(251, 227, 133)", "ansi") +
        ending +
        color("gray", "ansi") +
        ` \\* 0b` +
        e.toString(2).padStart(pad?.binary ?? 1, "0") +
        ending +
        ` *\\`+ color("white", "ansi"))(typeof e === "bigint" ? "n" : "")
    : e;

const testSuite = <TArgs extends Array<any>, TReturn>(
  func: (...args: TArgs) => TReturn
) => {
  return <const TestCasesArray extends Array<[expected: TReturn, ...TArgs]>>(
    ...testCases: TestCasesArray
  ) => {
    if (!testCases.length)
      throw new Error("testSuite should be provided with test cases");

    const formattingArr = Array.from<
      | {
          binary: number;
          decimal: number;
        }
      | undefined
    >({
      length: Math.max(...testCases.map((_) => _.length)),
    });

    for (
      let testCaseParamIndex = 0;
      testCaseParamIndex < testCases[0]!.length;
      testCaseParamIndex++
    ) {
      const isThisParamANumber = testCases
        .map((testCase) => typeof testCase[testCaseParamIndex])
        .every((_) => _ === "number" || _ === "bigint");

      if (!isThisParamANumber) continue;

      formattingArr[testCaseParamIndex] = {
        binary: Math.max(
          ...testCases.map(
            (testCase) =>
              (testCase[testCaseParamIndex] as number | bigint).toString(2)
                .length
          )
        ),
        decimal: Math.max(
          ...testCases.map(
            (testCase) =>
              (testCase[testCaseParamIndex] as number | bigint).toString(10)
                .length
          )
        ),
      };
    }

    testCases.forEach(([expected, ...args], testCaseIndex) =>
      test(
        color("rgb(0, 140, 153)", "ansi") +
          func.name +
          color("white", "ansi") +
          `(` +
          args
            .map((e, index) => renderTestNum(e, formattingArr[1 + index]))
            .join(color("white", "ansi") + ", ") +
          color("white", "ansi") +
          `)`
          + color('rgb(82, 178, 238)', 'ansi') + ` === ` +
          renderTestNum(expected, formattingArr[0]) +
          (testCaseIndex + 1 === testCases.length ? "\n" : ""),
        () => expect(func(...args)).toBe(expected)
      )
    );
  };
};

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

// prettier-ignore
testSuite(countBigintLeadingZeros)(
  /* expected x            powerOf2ToGetAssumedBigIntSize                             */
  [  0n,      0b1n,        0n /* 2 ** 0n === 1n (represents 1 bit of length)       */ ],
  [  7n,      0b00000001n, 3n /* 2 ** 3n === 8n (the closest highest above 5 bits) */ ],
  [  5n,      0b00000101n, 3n /* 2 ** 3n === 8n (the closest highest above 5 bits) */ ],
);

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

// prettier-ignore
testSuite(countBigintUsedBits)(
  /* expected x         powerOf2ToGetAssumedBigIntSize                             */
  [  1n,      0b1n,     0n /* 2 ** 0n === 1n (represents 1 bit of length)       */ ],
  [  1n,      0b00001n, 3n /* 2 ** 3n === 8n (the closest highest above 5 bits) */ ],
  [  3n,      0b00101n, 3n /* 2 ** 3n === 8n (the closest highest above 5 bits) */ ],
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
testSuite(getBigintSlotFromRight)(
  /* expected x               slotIndex slotSizeInBits */
  [  0b1n,    0b1n,           0n,       1n             ],
  [  0b1n,    0b1_0n,         1n,       1n             ],
  [  0b01n,   0b01_10n,       1n,       2n             ],
  [  0b01n,   0b01_10n,       1n,       2n             ],
  [  0b101n,  0b101_000_110n, 2n,       3n             ],
  [  0b000n,  0b101_000_110n, 1n,       3n             ],
  [  0b110n,  0b101_000_110n, 0n,       3n             ],
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
testSuite(getBigintSlotFromLeft)(
  /* expected x                     slotIndex slotSizeInBits assumedBigintSizeInBits */
  [  0b1n,    0b1n,                 0n,       1n,            1n                      ],

  [  0b1n,    0b0_0_0_0_0_0_0_0_1n, 8n,       1n,            9n                      ],
  [  0b1n,    0b0_0_0_0_0_0_0_1_0n, 7n,       1n,            9n                      ],

  [  0b01n,   0b00_00_00_01_10n,    3n,       2n,            10n                     ],
  [  0b01n,   0b00_00_00_01_10n,    3n,       2n,            10n                     ],

  [  0b101n,  0b101_000_110n,       0n,       3n,            9n                      ],
  [  0b000n,  0b101_000_110n,       1n,       3n,            9n                      ],
  [  0b110n,  0b101_000_110n,       2n,       3n,            9n                      ],
);

export function* genBigints(amountOfSlots: bigint, highestValueInSlot: bigint) {
  const bitsPerSlot = countBigintUsedBits(highestValueInSlot);

  function* genBigintsInner(
    slotsLeft: bigint,

    bitsPrefix: bigint = 0n
  ): Generator<bigint, void, unknown> {
    if (slotsLeft)
      for (let i = 0n; i <= highestValueInSlot; i++)
        yield* genBigintsInner(slotsLeft - 1n, (bitsPrefix << bitsPerSlot) + i);
    else yield bitsPrefix;
  }
  yield* genBigintsInner(amountOfSlots);
}
