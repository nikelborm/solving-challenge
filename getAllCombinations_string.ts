export function* getAllStringCombinations(
  stringLength: number,
  alphabet: string
) {
  function* getAllStringCombinationsInner(
    stringLength: number,
    stringPrefix: string = ""
  ): Generator<string, void, unknown> {
    if (stringLength)
      for (const char of alphabet)
        yield* getAllStringCombinationsInner(
          stringLength - 1,
          stringPrefix + char
        );
    else yield stringPrefix;
  }

  yield* getAllStringCombinationsInner(stringLength, alphabet);
}
