// type Method<CurrentKey extends keyof Foobar, ForbiddenKeys extends keyof Foobar> = [CurrentKey] extends [ForbiddenKeys] ? never: (() => Foobar<ForbiddenKeys |CurrentKey>)

function transform<
  TInstance extends object,
  TConstructorArgs extends unknown[],
  const TNamesOfMethodsReturningThisAndWhichCanBeUsedOnlyOnce extends // to distribute the type
  TAllInstanceKeys extends string
    ? TInstance[TAllInstanceKeys] extends () => TInstance
      ? TAllInstanceKeys
      : never
    : never,
  TAllInstanceKeys extends keyof TInstance
>(
  classConstructor: new (...args: TConstructorArgs) => TInstance,
  methodNames: TNamesOfMethodsReturningThisAndWhichCanBeUsedOnlyOnce[]
): new (...args: TConstructorArgs) => Prettify<{
  [K in keyof TInstance]: [K] extends [
    TNamesOfMethodsReturningThisAndWhichCanBeUsedOnlyOnce
  ]
    ? string
    : TInstance[K];
}> {
  return classConstructor as any;
}

class Foobar extends transform(
  class {
    constructor(asd: string) {}

    a = () => {
      return this;
    };

    b = () => {
      return this;
    };

    c = () => {
      return this;
    };

    expected_to_not_pass_d = "string";

    expected_to_not_pass_e = 123;

    expected_to_not_pass_f = () => {
      return "asdasdasdas";
    };

    expected_to_not_pass_g = () => {
      return {} as {
        a(): any;
        b(): any;
        c(): any;
        expected_to_not_pass_d: "string";
        expected_to_not_pass_e: 123;
        expected_to_not_pass_f(): any;
        expected_to_not_pass_g(): string; // <- won't pass as method that can be used only once because of this
        h(): any;
      };
    };

    h = () => {
      return {} as {
        a(): any;
        b(): any;
        c(): any;
        expected_to_not_pass_d: string;
        expected_to_not_pass_e: number;
        expected_to_not_pass_f(): any;
        expected_to_not_pass_g(): any;
        h(): any;
      }; // this type simulates returning this
    };
  },
  ["a", "h"]
) {}

// a and b should only be allowed to be chained exactly one time
const instance1 = new Foobar("asd");
instance1.b;
const stuff2 = instance1.b().a().b();
// instance.
//                                     ^?

type asd = FunctionConstructor;

export type Prettify<T> = { [P in keyof T]: T[P] } & {};
