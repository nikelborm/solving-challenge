import assert, { deepStrictEqual } from "node:assert";

const goodExit = {
  type: "exit",
  resolution: "matched",
} as const satisfies MatchedExitNode;

const badExit = {
  type: "exit",
  resolution: "didn't match",
} as const satisfies NotMatchedExitNode;

function happyPathBuilder<Context extends Record<string, unknown>>(
  initializeStaticContext: () => Context,
  transformStaticContext: (ctx: Context) => Context,
  worldHungerEnded: (ctx: Context) => boolean,
  fallbackNode: Node<Context>
) {
  const getNode = (ctx: Context): Node<Context> =>
    worldHungerEnded(ctx)
      ? goodExit
      : {
          type: "branch",
          staticContext: ctx,
          ifTrue: getNode(transformStaticContext(ctx)),
          ifFalse: fallbackNode,
        };

  return getNode(initializeStaticContext());
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
  happyPathBuilder<BasicContext>(
    /* initializeStaticContext */ () => ({
      wordStartsAtPositionInSuperString,
      charPositionOfSuperStringToBeChecked: wordStartsAtPositionInSuperString,
    }),

    /* transformStaticContext */ ({
      charPositionOfSuperStringToBeChecked,
    }) => ({
      wordStartsAtPositionInSuperString,
      charPositionOfSuperStringToBeChecked:
        charPositionOfSuperStringToBeChecked + 1,
    }),

    /* worldHungerEnded */ ({ charPositionOfSuperStringToBeChecked }) =>
      wordStartsAtPositionInSuperString + wordLength <=
      charPositionOfSuperStringToBeChecked,

    fallbackNode
  );

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

export function logObjectNicely(item: any): void {
  console.dir(item, {
    colors: true,
    compact: false,
    depth: null,
  });
}

function doesMatch(searchForWord: string, superString: string) {
  const matchStringNode =
    getNodeToMatchWordAtAnyPositionInStringOfCertainLength(
      searchForWord.length,
      superString.length
    );

  // TODO: make sure matchStringNode is DAG

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

function assertMatches(param: string) {
  assert(
    doesMatch(param, param),
    `param (${param}) didn't pass match to itself`
  );
  assert(!doesMatch("a" + param, param));
  assert(!doesMatch(param + "a", param));
  assert(!doesMatch("aa" + param, param));
  assert(!doesMatch("a" + param + "a", param));
  assert(!doesMatch(param + "aa", param));
  assert(doesMatch(param, "a" + param));
  assert(doesMatch(param, param + "a"));
  assert(doesMatch(param, "aa" + param));
  assert(doesMatch(param, param + "aa"));
  assert(doesMatch(param, "aa" + param + "a"));
  assert(doesMatch(param, "a" + param + "aa"));
}

assertMatches("abab");
assertMatches("aaaa");
assertMatches("abba");
assertMatches("baab");
assertMatches("baba");
assertMatches("abcd");
assertMatches("bba");
assertMatches("abb");
assertMatches("aba");
assertMatches("aaa");
assertMatches("ab");
assertMatches("aa");
assertMatches("b");
assertMatches("a");
assertMatches("");

const calculateSuccessAndFailureDistribution = ({
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

    // console.log("infer returned: ", {
    //   incomingTraffic,
    //   ...res,
    // });

    return res;
  };

  return infer(matchStringNode, fullAlphabetSize ** stringLength);
};

// console.log(
//   calculateSuccessAndFailureDistribution({
//     searchForWord: "-_-",
//     stringLength: 11,
//     matchCaseSensitively: true,
//     caseSensitiveAlphabet: "abcdefghijklmnopqrstuvwxyz",
//     caseInsensitiveAlphabet: "0123456789-_",
//   })
// );

const asd1 = calculateSuccessAndFailureDistribution({
  searchForWord: "a",
  stringLength: 2,
  matchCaseSensitively: true,
  caseSensitiveAlphabet: "ab",
  caseInsensitiveAlphabet: "",
});

// aa +    aA +    ab +    aB + //
// Aa +    AA      Ab      AB   //
// ba +    bA      bb      bB   //
// Ba +    BA      Bb      BB   //

deepStrictEqual(asd1, {
  successCases: 7,
  failureCases: 9,
});

const asd2 = calculateSuccessAndFailureDistribution({
  searchForWord: "a",
  stringLength: 2,
  matchCaseSensitively: true,
  caseSensitiveAlphabet: "ab",
  caseInsensitiveAlphabet: "0",
});

// aa +    aA +    ab +    aB +    a0 + //
// Aa +    AA      Ab      AB      A0   //
// ba +    bA      bb      bB      b0   //
// Ba +    BA      Bb      BB      B0   //
// 0a +    0A      0b      0B      00   //

deepStrictEqual(asd2, {
  successCases: 9,
  failureCases: 16,
});

const asd3 = calculateSuccessAndFailureDistribution({
  searchForWord: "a",
  stringLength: 2,
  matchCaseSensitively: false,
  caseSensitiveAlphabet: "ab",
  caseInsensitiveAlphabet: "0",
});

// aa +    aA +    ab +    aB +    a0 + //
// Aa +    AA +    Ab +    AB +    A0 + //
// ba +    bA +    bb      bB      b0   //
// Ba +    BA +    Bb      BB      B0   //
// 0a +    0A +    0b      0B      00   //

deepStrictEqual(asd3, {
  successCases: 16,
  failureCases: 9,
});

const asd4 = calculateSuccessAndFailureDistribution({
  searchForWord: "a0",
  stringLength: 2,
  matchCaseSensitively: false,
  caseSensitiveAlphabet: "ab",
  caseInsensitiveAlphabet: "0",
});

// aa      aA      ab      aB      a0 + //
// Aa      AA      Ab      AB      A0 + //
// ba      bA      bb      bB      b0   //
// Ba      BA      Bb      BB      B0   //
// 0a      0A      0b      0B      00   //

deepStrictEqual(asd4, {
  successCases: 2,
  failureCases: 23,
});

const asd5 = calculateSuccessAndFailureDistribution({
  searchForWord: "0a",
  stringLength: 2,
  matchCaseSensitively: false,
  caseSensitiveAlphabet: "ab",
  caseInsensitiveAlphabet: "0",
});

// aa      aA      ab      aB      a0   //
// Aa      AA      Ab      AB      A0   //
// ba      bA      bb      bB      b0   //
// Ba      BA      Bb      BB      B0   //
// 0a +    0A +    0b      0B      00   //

deepStrictEqual(asd5, {
  successCases: 2,
  failureCases: 23,
});

const asd6 = calculateSuccessAndFailureDistribution({
  searchForWord: "aa",
  stringLength: 3,
  matchCaseSensitively: true,
  caseSensitiveAlphabet: "abc",
  caseInsensitiveAlphabet: "01",
});

// aaa +  aba    aca    aAa    aBa    aCa    a0a    a1a    //
// baa +  bba    bca    bAa    bBa    bCa    b0a    b1a    //
// caa +  cba    cca    cAa    cBa    cCa    c0a    c1a    //
// Aaa +  Aba    Aca    AAa    ABa    ACa    A0a    A1a    //
// Baa +  Bba    Bca    BAa    BBa    BCa    B0a    B1a    //
// Caa +  Cba    Cca    CAa    CBa    CCa    C0a    C1a    //
// 0aa +  0ba    0ca    0Aa    0Ba    0Ca    00a    01a    //
// 1aa +  1ba    1ca    1Aa    1Ba    1Ca    10a    11a    //
//
// aab +  abb    acb    aAb    aBb    aCb    a0b    a1b    //
// bab    bbb    bcb    bAb    bBb    bCb    b0b    b1b    //
// cab    cbb    ccb    cAb    cBb    cCb    c0b    c1b    //
// Aab    Abb    Acb    AAb    ABb    ACb    A0b    A1b    //
// Bab    Bbb    Bcb    BAb    BBb    BCb    B0b    B1b    //
// Cab    Cbb    Ccb    CAb    CBb    CCb    C0b    C1b    //
// 0ab    0bb    0cb    0Ab    0Bb    0Cb    00b    01b    //
// 1ab    1bb    1cb    1Ab    1Bb    1Cb    10b    11b    //
//
// aac +  abc    acc    aAc    aBc    aCc    a0c    a1c    //
// bac    bbc    bcc    bAc    bBc    bCc    b0c    b1c    //
// cac    cbc    ccc    cAc    cBc    cCc    c0c    c1c    //
// Aac    Abc    Acc    AAc    ABc    ACc    A0c    A1c    //
// Bac    Bbc    Bcc    BAc    BBc    BCc    B0c    B1c    //
// Cac    Cbc    Ccc    CAc    CBc    CCc    C0c    C1c    //
// 0ac    0bc    0cc    0Ac    0Bc    0Cc    00c    01c    //
// 1ac    1bc    1cc    1Ac    1Bc    1Cc    10c    11c    //

//

// aaA +  abA    acA    aAA    aBA    aCA    a0A    a1A    //
// baA    bbA    bcA    bAA    bBA    bCA    b0A    b1A    //
// caA    cbA    ccA    cAA    cBA    cCA    c0A    c1A    //
// AaA    AbA    AcA    AAA    ABA    ACA    A0A    A1A    //
// BaA    BbA    BcA    BAA    BBA    BCA    B0A    B1A    //
// CaA    CbA    CcA    CAA    CBA    CCA    C0A    C1A    //
// 0aA    0bA    0cA    0AA    0BA    0CA    00A    01A    //
// 1aA    1bA    1cA    1AA    1BA    1CA    10A    11A    //
//
// aaB +  abB    acB    aAB    aBB    aCB    a0B    a1B    //
// baB    bbB    bcB    bAB    bBB    bCB    b0B    b1B    //
// caB    cbB    ccB    cAB    cBB    cCB    c0B    c1B    //
// AaB    AbB    AcB    AAB    ABB    ACB    A0B    A1B    //
// BaB    BbB    BcB    BAB    BBB    BCB    B0B    B1B    //
// CaB    CbB    CcB    CAB    CBB    CCB    C0B    C1B    //
// 0aB    0bB    0cB    0AB    0BB    0CB    00B    01B    //
// 1aB    1bB    1cB    1AB    1BB    1CB    10B    11B    //
//
// aaC +  abC    acC    aAC    aBC    aCC    a0C    a1C    //
// baC    bbC    bcC    bAC    bBC    bCC    b0C    b1C    //
// caC    cbC    ccC    cAC    cBC    cCC    c0C    c1C    //
// AaC    AbC    AcC    AAC    ABC    ACC    A0C    A1C    //
// BaC    BbC    BcC    BAC    BBC    BCC    B0C    B1C    //
// CaC    CbC    CcC    CAC    CBC    CCC    C0C    C1C    //
// 0aC    0bC    0cC    0AC    0BC    0CC    00C    01C    //
// 1aC    1bC    1cC    1AC    1BC    1CC    10C    11C    //

//

// aa0 +  ab0    ac0    aA0    aB0    aC0    a00    a10    //
// ba0    bb0    bc0    bA0    bB0    bC0    b00    b10    //
// ca0    cb0    cc0    cA0    cB0    cC0    c00    c10    //
// Aa0    Ab0    Ac0    AA0    AB0    AC0    A00    A10    //
// Ba0    Bb0    Bc0    BA0    BB0    BC0    B00    B10    //
// Ca0    Cb0    Cc0    CA0    CB0    CC0    C00    C10    //
// 0a0    0b0    0c0    0A0    0B0    0C0    000    010    //
// 1a0    1b0    1c0    1A0    1B0    1C0    100    110    //
//
// aa1 +  ab1    ac1    aA1    aB1    aC1    a01    a11    //
// ba1    bb1    bc1    bA1    bB1    bC1    b01    b11    //
// ca1    cb1    cc1    cA1    cB1    cC1    c01    c11    //
// Aa1    Ab1    Ac1    AA1    AB1    AC1    A01    A11    //
// Ba1    Bb1    Bc1    BA1    BB1    BC1    B01    B11    //
// Ca1    Cb1    Cc1    CA1    CB1    CC1    C01    C11    //
// 0a1    0b1    0c1    0A1    0B1    0C1    001    011    //
// 1a1    1b1    1c1    1A1    1B1    1C1    101    111    //
//

console.log(asd6);

deepStrictEqual(asd6, {
  successCases: 15,
  failureCases: 497,
});

const asd7 = calculateSuccessAndFailureDistribution({
  searchForWord: "aa",
  stringLength: 3,
  matchCaseSensitively: false,
  caseSensitiveAlphabet: "abc",
  caseInsensitiveAlphabet: "01",
});

// alphabet => 'abcABC01'
// alphabet.size => 8

// aaa +  aba    aca    aAa +  aBa    aCa    a0a    a1a    //
// baa +  bba    bca    bAa +  bBa    bCa    b0a    b1a    //
// caa +  cba    cca    cAa +  cBa    cCa    c0a    c1a    //
// Aaa +  Aba    Aca    AAa +  ABa    ACa    A0a    A1a    //
// Baa +  Bba    Bca    BAa +  BBa    BCa    B0a    B1a    //
// Caa +  Cba    Cca    CAa +  CBa    CCa    C0a    C1a    //
// 0aa +  0ba    0ca    0Aa +  0Ba    0Ca    00a    01a    //
// 1aa +  1ba    1ca    1Aa +  1Ba    1Ca    10a    11a    //
//
// aab +  abb    acb    aAb +  aBb    aCb    a0b    a1b    //
// bab    bbb    bcb    bAb    bBb    bCb    b0b    b1b    //
// cab    cbb    ccb    cAb    cBb    cCb    c0b    c1b    //
// Aab +  Abb    Acb    AAb +  ABb    ACb    A0b    A1b    //
// Bab    Bbb    Bcb    BAb    BBb    BCb    B0b    B1b    //
// Cab    Cbb    Ccb    CAb    CBb    CCb    C0b    C1b    //
// 0ab    0bb    0cb    0Ab    0Bb    0Cb    00b    01b    //
// 1ab    1bb    1cb    1Ab    1Bb    1Cb    10b    11b    //
//
// aac +  abc    acc    aAc +  aBc    aCc    a0c    a1c    //
// bac    bbc    bcc    bAc    bBc    bCc    b0c    b1c    //
// cac    cbc    ccc    cAc    cBc    cCc    c0c    c1c    //
// Aac +  Abc    Acc    AAc +  ABc    ACc    A0c    A1c    //
// Bac    Bbc    Bcc    BAc    BBc    BCc    B0c    B1c    //
// Cac    Cbc    Ccc    CAc    CBc    CCc    C0c    C1c    //
// 0ac    0bc    0cc    0Ac    0Bc    0Cc    00c    01c    //
// 1ac    1bc    1cc    1Ac    1Bc    1Cc    10c    11c    //

//

// aaA +  abA    acA    aAA +  aBA    aCA    a0A    a1A    //
// baA +  bbA    bcA    bAA +  bBA    bCA    b0A    b1A    //
// caA +  cbA    ccA    cAA +  cBA    cCA    c0A    c1A    //
// AaA +  AbA    AcA    AAA +  ABA    ACA    A0A    A1A    //
// BaA +  BbA    BcA    BAA +  BBA    BCA    B0A    B1A    //
// CaA +  CbA    CcA    CAA +  CBA    CCA    C0A    C1A    //
// 0aA +  0bA    0cA    0AA +  0BA    0CA    00A    01A    //
// 1aA +  1bA    1cA    1AA +  1BA    1CA    10A    11A    //
//
// aaB +  abB    acB    aAB +  aBB    aCB    a0B    a1B    //
// baB    bbB    bcB    bAB    bBB    bCB    b0B    b1B    //
// caB    cbB    ccB    cAB    cBB    cCB    c0B    c1B    //
// AaB +  AbB    AcB    AAB +  ABB    ACB    A0B    A1B    //
// BaB    BbB    BcB    BAB    BBB    BCB    B0B    B1B    //
// CaB    CbB    CcB    CAB    CBB    CCB    C0B    C1B    //
// 0aB    0bB    0cB    0AB    0BB    0CB    00B    01B    //
// 1aB    1bB    1cB    1AB    1BB    1CB    10B    11B    //
//
// aaC +  abC    acC    aAC +  aBC    aCC    a0C    a1C    //
// baC    bbC    bcC    bAC    bBC    bCC    b0C    b1C    //
// caC    cbC    ccC    cAC    cBC    cCC    c0C    c1C    //
// AaC +  AbC    AcC    AAC +  ABC    ACC    A0C    A1C    //
// BaC    BbC    BcC    BAC    BBC    BCC    B0C    B1C    //
// CaC    CbC    CcC    CAC    CBC    CCC    C0C    C1C    //
// 0aC    0bC    0cC    0AC    0BC    0CC    00C    01C    //
// 1aC    1bC    1cC    1AC    1BC    1CC    10C    11C    //

//

// aa0 +  ab0    ac0    aA0 +  aB0    aC0    a00    a10    //
// ba0    bb0    bc0    bA0    bB0    bC0    b00    b10    //
// ca0    cb0    cc0    cA0    cB0    cC0    c00    c10    //
// Aa0 +  Ab0    Ac0    AA0 +  AB0    AC0    A00    A10    //
// Ba0    Bb0    Bc0    BA0    BB0    BC0    B00    B10    //
// Ca0    Cb0    Cc0    CA0    CB0    CC0    C00    C10    //
// 0a0    0b0    0c0    0A0    0B0    0C0    000    010    //
// 1a0    1b0    1c0    1A0    1B0    1C0    100    110    //
//
// aa1 +  ab1    ac1    aA1 +  aB1    aC1    a01    a11    //
// ba1    bb1    bc1    bA1    bB1    bC1    b01    b11    //
// ca1    cb1    cc1    cA1    cB1    cC1    c01    c11    //
// Aa1 +  Ab1    Ac1    AA1 +  AB1    AC1    A01    A11    //
// Ba1    Bb1    Bc1    BA1    BB1    BC1    B01    B11    //
// Ca1    Cb1    Cc1    CA1    CB1    CC1    C01    C11    //
// 0a1    0b1    0c1    0A1    0B1    0C1    001    011    //
// 1a1    1b1    1c1    1A1    1B1    1C1    101    111    //
//

console.log(asd7);

// deepStrictEqual(asd7, {
//   successCases: 56,
//   failureCases: 456,
// });

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
