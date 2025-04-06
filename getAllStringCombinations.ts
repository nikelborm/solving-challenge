export function* getAllStringCombinations(
  stringLength: number,
  alphabet: string,

  stringPrefix: string = ""
): Generator<string, void, unknown> {
  if (stringLength)
    for (const char of alphabet) {
      yield* getAllStringCombinations(
        stringLength - 1,
        alphabet,
        stringPrefix + char
      );
    }
  else yield stringPrefix;
}
