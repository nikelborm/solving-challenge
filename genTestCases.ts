import { getAllStringCombinations } from "getAllStringCombinations.js";
import { writeFile } from "node:fs/promises";

// amountOfCaseSensitiveCharactersInAlphabet: [0, ..., 26]
// amountOfCaseInsensitiveCharactersInAlphabet: [0, ..., 22]
// isCaseSensitive: [false, true]
// superStringLength: [1, ..., 26*2+22]
// subStringLength: [1, ..., 26*2+22]

// const caseSensitiveLowerCharacters = "a567890-=_+[]{};':`";
// const caseInsensitiveCharacters = "1234567890-_";
// const caseSensitiveLowerCharacters = "abcdefghijklmnopqrstuvwxyz";
// const maxSuperStringLength = 11;

const caseInsensitiveCharacters = "12345";
const caseSensitiveLowerCharacters = "abcde";
const maxSuperStringLength = 6;

const allTestCasePermutations = [];

for (
  let amountOfCaseSensitiveCharactersInAlphabet = 0;
  amountOfCaseSensitiveCharactersInAlphabet <=
  caseSensitiveLowerCharacters.length;
  amountOfCaseSensitiveCharactersInAlphabet++
) {
  const caseSensitiveLowerAlphabet = caseSensitiveLowerCharacters.slice(
    0,
    amountOfCaseSensitiveCharactersInAlphabet
  );
  for (
    let amountOfCaseInsensitiveCharactersInAlphabet = 0;
    amountOfCaseInsensitiveCharactersInAlphabet <=
    caseInsensitiveCharacters.length;
    amountOfCaseInsensitiveCharactersInAlphabet++
  ) {
    const caseInsensitiveAlphabet = caseInsensitiveCharacters.slice(
      0,
      amountOfCaseInsensitiveCharactersInAlphabet
    );
    if (
      amountOfCaseSensitiveCharactersInAlphabet === 0 &&
      amountOfCaseInsensitiveCharactersInAlphabet === 0
    )
      continue;

    const alphabet =
      caseSensitiveLowerAlphabet +
      caseSensitiveLowerAlphabet.toUpperCase() +
      caseInsensitiveAlphabet;

    for (const isCaseSensitive of [false, true]) {
      for (
        let superStringLength = 1;
        superStringLength <=
        Math.min(alphabet.length + 3, maxSuperStringLength);
        superStringLength++
      ) {
        for (
          let subStringLength = 1;
          subStringLength <= superStringLength;
          subStringLength++
        ) {
          for (const searchFor of getAllStringCombinations(
            subStringLength,
            alphabet
          )) {
            const testCase = {
              alphabet,
              isCaseSensitive,
              superStringLength,
              searchFor,
            };
            allTestCasePermutations.push(testCase);
          }
        }
      }
    }
  }
}

await writeFile(
  "./top21millsEasiestPermutations.json",
  JSON.stringify(
    allTestCasePermutations
      .sort(
        (a, b) =>
          a.alphabet.length ** a.superStringLength -
          b.alphabet.length ** b.superStringLength
      )
      .slice(0, 21_000_000) // ~~ 2×1024×1024×1024÷103 (103 bytes per object in 2GB file)
  )
);
