const goodExit = {
  type: "exit",
  resolution: "matched",
} as const satisfies MatchedExitNode;

const badExit = {
  type: "exit",
  resolution: "didn't match",
} as const satisfies NotMatchedExitNode;

function happyPathBuilder<Context extends Record<string, unknown>>(c: {
  initializeStaticContext: () => Context;
  transformStaticContext: (ctx: Context) => Context;
  worldHungerEnded: (ctx: Context) => boolean;
  fallbackNode: Node<Context>;
}) {
  const getNode = (ctx: Context): Node<Context> =>
    c.worldHungerEnded(ctx)
      ? goodExit
      : {
          type: "branch",
          staticContext: ctx,
          ifTrue: getNode(c.transformStaticContext(ctx)),
          ifFalse: c.fallbackNode,
        };

  return getNode(c.initializeStaticContext());
}

type BasicContext = {
  wordStartsAtPositionInSuperString: number;
  charPositionOfSuperStringToBeChecked: number;
};

const getNodeToMatchWordStaringFromAtPosition = (
  wordStartsAtPositionInSuperString: number,
  wordLength: number,
  fallbackNode: Node<BasicContext>
) =>
  happyPathBuilder<BasicContext>({
    initializeStaticContext: () => ({
      wordStartsAtPositionInSuperString,
      charPositionOfSuperStringToBeChecked: wordStartsAtPositionInSuperString,
    }),

    transformStaticContext: ({ charPositionOfSuperStringToBeChecked }) => ({
      wordStartsAtPositionInSuperString,
      charPositionOfSuperStringToBeChecked:
        charPositionOfSuperStringToBeChecked + 1,
    }),

    worldHungerEnded: ({ charPositionOfSuperStringToBeChecked }) =>
      wordStartsAtPositionInSuperString + wordLength <=
      charPositionOfSuperStringToBeChecked,

    fallbackNode,
  });

function getNodeToMatchWordAtAnyPositionInStringOfCertainLength(
  wordLength: number,
  stringLength: number
) {
  const maxFirstCharPosition = stringLength - wordLength + 1;

  const getNode = (currentFirstCharPosition: number): Node<BasicContext> =>
    currentFirstCharPosition >= maxFirstCharPosition
      ? badExit
      : getNodeToMatchWordStaringFromAtPosition(
          currentFirstCharPosition,
          wordLength,
          getNode(currentFirstCharPosition + 1)
        );

  return getNode(0);
}

export function doesMatch(searchForWord: string, superString: string) {
  const matchStringNode =
    getNodeToMatchWordAtAnyPositionInStringOfCertainLength(
      searchForWord.length,
      superString.length
    );

  // TODO: make sure that matchStringNode is DAG

  const infer = (node: Node<BasicContext>) => {
    if (node.type === "branch") {
      const {
        charPositionOfSuperStringToBeChecked,
        wordStartsAtPositionInSuperString,
      } = node.staticContext;

      const char =
        searchForWord[
          charPositionOfSuperStringToBeChecked -
            wordStartsAtPositionInSuperString
        ]!;

      return infer(
        superString[charPositionOfSuperStringToBeChecked] === char
          ? node.ifTrue
          : node.ifFalse
      );
    }

    return node.resolution === "matched";
  };

  return infer(matchStringNode);
}

export const calculateSuccessAndFailureDistribution = ({
  searchForWord,
  stringLength,
  matchCaseSensitively,
  caseSensitiveAlphabet,
  caseInsensitiveAlphabet,
}: {
  searchForWord: string;
  stringLength: number;
  matchCaseSensitively: boolean;

  caseSensitiveAlphabet: string;
  caseInsensitiveAlphabet: string;
}) => {
  const fullAlphabetSize =
    caseSensitiveAlphabet.length * 2 + caseInsensitiveAlphabet.length;

  const matchStringNode =
    getNodeToMatchWordAtAnyPositionInStringOfCertainLength(
      searchForWord.length,
      stringLength
    );

  const infer = (
    node: Node<BasicContext>,
    incomingTraffic: number
  ): {
    successCases: number;
    failureCases: number;
  } => {
    if (node.type === "branch") {
      const {
        charPositionOfSuperStringToBeChecked,
        wordStartsAtPositionInSuperString,
      } = node.staticContext;

      const char =
        searchForWord[
          charPositionOfSuperStringToBeChecked -
            wordStartsAtPositionInSuperString
        ]!;

      const chanceOfTrue =
        [...caseInsensitiveAlphabet].includes(char) || matchCaseSensitively
          ? 1 / fullAlphabetSize
          : 2 / fullAlphabetSize; // because on each letter there are 2 options

      const chanceOfFalse = 1 - chanceOfTrue;

      const trueBranch = infer(node.ifTrue, incomingTraffic * chanceOfTrue);

      const falseBranch = infer(node.ifFalse, incomingTraffic * chanceOfFalse);

      return {
        successCases: falseBranch.successCases + trueBranch.successCases,
        failureCases: falseBranch.failureCases + trueBranch.failureCases,
      };
    }

    const res =
      node.resolution === "matched"
        ? {
            successCases: incomingTraffic,
            failureCases: 0,
          }
        : {
            successCases: 0,
            failureCases: incomingTraffic,
          };

    return res;
  };

  return infer(matchStringNode, fullAlphabetSize ** stringLength);
};

////////////////////////////////////////////////////////////////////////////////

type MatchedExitNode = {
  type: "exit";
  resolution: "matched";
};

type NotMatchedExitNode = {
  type: "exit";
  resolution: "didn't match";
};

type BranchNode<StaticContext extends Record<string, unknown>> = {
  type: "branch";
  // the following states must be mutually exclusive
  ifTrue: Node<StaticContext>;
  ifFalse: Node<StaticContext>;
  staticContext: StaticContext;
};

type Node<StaticContext extends Record<string, unknown>> =
  | MatchedExitNode
  | NotMatchedExitNode
  | BranchNode<StaticContext>;
