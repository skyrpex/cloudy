import { AttributeValue } from "@aws-sdk/client-dynamodb";

// See https://github.com/sam-goodwin/typesafe-dynamodb/blob/2ca185f83cbc482b468f74a2b61f116a74206192/src/expression-attributes.ts

export type LowercaseLetter =
  | "a"
  | "b"
  | "c"
  | "d"
  | "e"
  | "f"
  | "g"
  | "h"
  | "i"
  | "j"
  | "k"
  | "l"
  | "m"
  | "n"
  | "o"
  | "p"
  | "q"
  | "r"
  | "s"
  | "t"
  | "u"
  | "v"
  | "w"
  | "x"
  | "y"
  | "z";

export type UppercaseLetter = Uppercase<LowercaseLetter>;

export type Letter = LowercaseLetter | UppercaseLetter;

export type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export type AlphaNumeric = Digit | Letter;

export type ExpressionAttributeValues<Expression extends string | undefined> =
  undefined extends Expression
    ? {}
    : ParseConditionExpressionValues<Expression> extends never
      ? {}
      : {
          ExpressionAttributeValues: {
            [name in ParseConditionExpressionValues<Expression> as `:${name}`]: AttributeValue;
          };
        };

// type XV =
//   ExpressionAttributeValues<"SET #events = :events, #timestamp = :timestamp ADD #revision :totalNewEvents">
// type XN =
//   ExpressionAttributeNames<"SET #events = :events, #timestamp = :timestamp ADD #revision :totalNewEvents">

// type ExpressionAttributeValues2<Expression extends string | undefined, Item extends object> =
//   undefined extends Expression
//     ? {}
//     : ParseConditionExpressionValues<Expression> extends never
//     ? {}
//     : {
//         ExpressionAttributeValues: {
//           [name in ParseConditionExpressionValues<Expression> as `:${name}`]: name extends keyof Item ? Item[name] : AttributeValue
//         }
//       }
// type XV2 =
//   ExpressionAttributeValues2<"SET #a = :a, #timestamp = :timestamp ADD #revision :totalNewEvents", {
//       a: { S: string }
//       b: { N: string }
//   }>

export type ExpressionAttributeNames<Expression extends string | undefined> =
  undefined extends Expression
    ? {}
    : ParseConditionExpressionNames<Expression> extends never
      ? {}
      : {
          ExpressionAttributeNames: {
            [name in ParseConditionExpressionNames<Expression> as `#${name}`]: string;
          };
        };

type ParseConditionExpressionNames<Text extends string | undefined> = Extract<
  ParsePrefixedString<"#", Text>,
  string
>;

type ParseConditionExpressionValues<Text extends string | undefined> = Extract<
  ParsePrefixedString<":", Text>,
  string
>;
// type x = ParseConditionExpressionValues<":x :y">

type ParsePrefixedString<
  Prefix extends string,
  Text extends string | undefined = undefined,
  Names extends string | undefined = undefined,
> = undefined | "" extends Text
  ? Names
  : Text extends `${Prefix}${infer Tail}`
    ? // it is a name
      ParsePrefixedString<
        Prefix,
        Skip<Tail, AlphaNumeric>,
        undefined extends Names
          ? Read<Tail, AlphaNumeric>
          : Names | Read<Tail, AlphaNumeric>
      >
    : Text extends `${string}${infer Tail}`
      ? ParsePrefixedString<Prefix, Tail, Names>
      : Names;

type Skip<
  S extends string,
  Char extends string | number,
> = S extends `${Char}${infer Tail}`
  ? Skip<Tail, Char>
  : S extends `${Char}`
    ? ""
    : S;

// type a = Read<"abc", "a" | "b">;

type Read<
  S extends string,
  Char extends string | number,
  Accum extends string = "",
> = S extends `${infer C}${infer rest}`
  ? C extends Char
    ? Read<rest, Char, `${Accum}${C}`>
    : Accum
  : Accum;
