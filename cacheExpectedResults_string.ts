import { getAllStringCombinations } from "getAllCombinations_string.js";

function countMatchesStupidly(
  searchFor: string,
  superStringLength: number,
  isCaseSensitive: boolean,
  alphabet: string
) {
  const subString = isCaseSensitive ? searchFor.toLowerCase() : searchFor;

  let counter = 0;

  for (const superString of getAllStringCombinations(
    superStringLength,
    alphabet
  )) {
    if (
      (isCaseSensitive ? superString.toLowerCase() : superString).includes(
        subString
      )
    )
      counter++;
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

  for (const { workerIndex, worker } of workers) {
    const batch = testCases
      .filter((_, i) => i % amountOfWorkers === workerIndex)
      .slice(-100, -10);

    const data = {
      batch,
      workerIndex,
    };

    worker.postMessage(data);
  }
} else {
  console.log("I'm in a worker");
  self.addEventListener("message", async (event) => {
    const context = event.data;

    const startNanosecs = Bun.nanoseconds();

    console.log({
      workerIndex: context.workerIndex,
      startNanosecs,
    });

    for (const testCase of context.batch) {
      const { alphabet, isCaseSensitive, superStringLength, searchFor } =
        testCase;
      testCase.expectedResult = countMatchesStupidly(
        searchFor,
        superStringLength,
        isCaseSensitive,
        alphabet
      );
    }

    const finishNanosecs = Bun.nanoseconds();

    console.log({
      workerIndex: context.workerIndex,
      finishNanosecs,
      secsDiff: (finishNanosecs - startNanosecs) / 1_000_000_000,
    });

    self.terminate();

    // await Bun.write(
    //   `./top21millsEasiestTestCases.chunk.${context.workerIndex}.json`,
    //   JSON.stringify(context.batch)
    // );
  });
}
