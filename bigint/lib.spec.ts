import { color } from "bun" with { type: "json" };
import { expect, test } from "bun:test";
import {
  countBigintLeadingZeros,
  countBigintUsedBits,
  isBitSequenceContainsAnotherBitSequence,
  getBigintSlotFromLeft,
  getBigintSlotFromRight as _getBigintSlotFromRight,
  getBigintWithUpdatedSlotCountingFromRight,
} from "./lib.js";

const testSuite = <TArgs extends Array<any>, TReturn>(
  func: (...args: TArgs) => TReturn
) => {
  const methodColor = color("#52adf2", "ansi")!;
  const operatorColor = color("#2bbac5", "ansi")!;

  const syntaxColor = color("#d55fde", "ansi")!;
  const parenthesisColor = color("#ffd700", "ansi")!;
  const commaColor = color("white", "ansi")!;

  const numberPartOfBigintColor = color("#d89650", "ansi")!;
  const nLetterOfBigintColor = syntaxColor!;

  const commentColor = color("#5c6370", "ansi")!;

  const booleanColor = numberPartOfBigintColor;

  const renderValue = (e: any, pad?: { binary?: number; decimal?: number }) =>
    typeof e === "bigint" || typeof e === "number"
      ? ((ending = typeof e === "bigint" ? nLetterOfBigintColor + "n" : "") =>
          numberPartOfBigintColor +
          e.toString(10).padStart(pad?.decimal ?? 1, " ") +
          ending +
          commentColor +
          ` \\* 0b` +
          e.toString(2).padStart(pad?.binary ?? 1, "0") +
          ending +
          ` *\\`)()
      : typeof e === "boolean"
        ? booleanColor + e
        : e;

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
        methodColor +
          func.name +
          parenthesisColor +
          `(` +
          args
            .map((e, index) => renderValue(e, formattingArr[1 + index]))
            .join(commaColor + ", ") +
          parenthesisColor +
          `)` +
          operatorColor +
          ` === ` +
          color("white", "ansi") +
          renderValue(expected, formattingArr[0]) +
          (testCaseIndex + 1 === testCases.length ? "\n" : ""),
        () => expect(func(...args)).toBe(expected)
      )
    );
  };
};

// prettier-ignore
testSuite(countBigintLeadingZeros)(
  /* expected x            powerOf2ToGetAssumedBigIntSize                             */
  [  0n,      0b1n,        0n /* 2 ** 0n === 1n (represents 1 bit of length)       */ ],
  [  7n,      0b00000001n, 3n /* 2 ** 3n === 8n (the closest highest above 5 bits) */ ],
  [  5n,      0b00000101n, 3n /* 2 ** 3n === 8n (the closest highest above 5 bits) */ ],
  [  0n,      0b10000101n, 3n /* 2 ** 3n === 8n (the closest highest above 5 bits) */ ],
);

// prettier-ignore
testSuite(countBigintUsedBits)(
  /* expected x            powerOf2ToGetAssumedBigIntSize                             */
  [  1n,      0b1n,        0n /* 2 ** 0n === 1n (represents 1 bit of length)       */ ],
  [  1n,      0b00000001n, 3n /* 2 ** 3n === 8n (the closest highest above 5 bits) */ ],
  [  3n,      0b00000101n, 3n /* 2 ** 3n === 8n (the closest highest above 5 bits) */ ],
  [  8n,      0b10000101n, 3n /* 2 ** 3n === 8n (the closest highest above 5 bits) */ ],
);

const getBigintSlotFromRight = (
  bitSequence: bigint,
  amountOfSlotsSkippedFromTheRight: bigint,
  slotSizeInBits: bigint
) =>
  _getBigintSlotFromRight(
    bitSequence,
    slotSizeInBits
  )(amountOfSlotsSkippedFromTheRight);

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

// prettier-ignore
testSuite(getBigintWithUpdatedSlotCountingFromRight)(
  /* expected             x                   slotIndexCountingFromRight highestValueInSlot newSlotContent */
  [  0b0n,                0b0n,               0n,                        0b1n,              0b0n           ],
  [  0b1n,                0b0n,               0n,                        0b1n,              0b1n           ],
  [  0b0n,                0b1n,               0n,                        0b1n,              0b0n           ],
  [  0b1n,                0b1n,               0n,                        0b1n,              0b1n           ],
  [  0b101_010_101_000n,  0b101_010_101_010n, 0n,                        0b111n,            0b000n         ],
  [  0b101_010_101_111n,  0b101_010_101_010n, 0n,                        0b111n,            0b111n         ],
  [  0b101_010_000_010n,  0b101_010_101_010n, 1n,                        0b111n,            0b000n         ],
  [  0b101_010_111_010n,  0b101_010_101_010n, 1n,                        0b111n,            0b111n         ],
  [  0b101_000_101_010n,  0b101_010_101_010n, 2n,                        0b111n,            0b000n         ],
  [  0b101_111_101_010n,  0b101_010_101_010n, 2n,                        0b111n,            0b111n         ],
);

// prettier-ignore
testSuite(isBitSequenceContainsAnotherBitSequence)(
  /* expected superBitSequence subBitSequence slotSizeInBits superBitSequenceSizeInSlots subBitSequenceSizeInSlots */
  [  true,    0b0n,            0b0n,          1n,            1n,                         1n                        ],
  [  false,   0b0n,            0b1n,          1n,            1n,                         1n                        ],
  [  false,   0b1n,            0b0n,          1n,            1n,                         1n                        ],
  [  true,    0b1n,            0b1n,          1n,            1n,                         1n                        ],
  [  true,    0b111_101_010n,  0b111n,        3n,            3n,                         1n                        ],
  [  true,    0b111_101_010n,  0b101n,        3n,            3n,                         1n                        ],
  [  true,    0b111_101_010n,  0b010n,        3n,            3n,                         1n                        ],
  [  false,   0b111_101_010n,  0b000n,        3n,            3n,                         1n                        ],
  [  false,   0b111_101_010n,  0b011n,        3n,            3n,                         1n                        ],
);

// TODO: add tests for errors
const as = true;
