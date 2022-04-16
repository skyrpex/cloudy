# @cloudy-ts/opaque-type

[![NPM version](https://img.shields.io/npm/v/@cloudy-ts/opaque-type/latest.svg)](https://www.npmjs.com/package/@cloudy-ts/opaque-type)
[![NPM downloads](https://img.shields.io/npm/dm/@cloudy-ts/opaque-type.svg)](https://www.npmjs.com/package/@cloudy-ts/opaque-type)

Implements [opaque types](https://codemix.com/opaque-types-in-javascript/) in TypeScript.

An opaque type, in TypeScript, is a type whose true structure is obfuscated to the compiler at compile-time. These types can make your code more type safe, secure, easier to refactor, and faster.

## Installation

```sh
pnpm add @cloudy-ts/opaque-type
```

## Usage

```ts
import { OpaqueType } from "@vt/opaque-type";

type AccountId = OpaqueType<number, { readonly t: unique symbol }>;
type PersonId = OpaqueType<number, { readonly t: unique symbol }>;

const createPersonId = () => 1 as PersonId;

// This will fail to compile, as they are fundamentally different types.
const accountId: AccountId = createPersonId();
```
