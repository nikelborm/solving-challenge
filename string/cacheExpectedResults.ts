import { getAllStringCombinations } from "./getAllCombinations.js";

function countMatchesStupidly(
  searchFor: string,
  superStringLength: number,
  isCaseSensitive: boolean,
  alphabet: string
) {
  const subString = isCaseSensitive ? searchFor.toLowerCase() : searchFor;

  let counter = 0;

  for (const superStringOriginal of getAllStringCombinations(
    superStringLength,
    alphabet
  )) {
    const superString = isCaseSensitive
      ? superStringOriginal.toLowerCase()
      : superStringOriginal;

    if (superString.includes(subString)) counter++;
  }

  return counter;
}

declare var self: Bun.Worker;

if (Bun.isMainThread) {
  const testCases: {
    alphabet: string;
    isCaseSensitive: boolean;
    superStringLength: number;
    searchFor: string;
  }[] = await Bun.file("./top21millsEasiestPermutations.json").json();
  const amountOfWorkers = 16;

  const workers = Array.from({ length: amountOfWorkers }, (e, workerIndex) => ({
    workerIndex,
    worker: new Worker(import.meta.url),
  }));

  for (const { workerIndex, worker } of workers)
    worker.postMessage({
      batch: testCases
        .filter((_, i) => i % amountOfWorkers === workerIndex)
        .slice(-100, -10), // 90 tasks before top 10 tasks
      workerIndex,
    });
} else {
  console.log("I'm in a worker");

  self.addEventListener("message", async (event) => {
    const context = event.data;

    const startNanoseconds = Bun.nanoseconds();

    console.log({
      workerIndex: context.workerIndex,
      startNanoseconds,
    });

    for (const testCase of context.batch)
      testCase.expectedResult = countMatchesStupidly(
        testCase.searchFor,
        testCase.superStringLength,
        testCase.isCaseSensitive,
        testCase.alphabet
      );

    const finishNanoseconds = Bun.nanoseconds();

    console.log({
      workerIndex: context.workerIndex,
      finishNanoseconds,
      secsDiff: (finishNanoseconds - startNanoseconds) / 1_000_000_000,
    });

    self.terminate();

    // await Bun.write(
    //   `./top21millsEasiestTestCases.chunk.${context.workerIndex}.json`,
    //   JSON.stringify(context.batch)
    // );
  });
}
