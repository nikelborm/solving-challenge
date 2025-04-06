export function* getAllStringCombinations(
  stringLength: number,
  alphabet: string
) {
  function* getAllStringCombinationsInner(
    stringLength: number,
    alphabet: string,

    stringPrefix: string = ""
  ): Generator<string, void, unknown> {
    if (stringLength)
      for (const char of alphabet) {
        yield* getAllStringCombinationsInner(
          stringLength - 1,
          alphabet,
          stringPrefix + char
        );
      }
    else yield stringPrefix;
  }

  yield* getAllStringCombinationsInner(stringLength, alphabet);
}
