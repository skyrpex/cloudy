# @cloudy-ts/string-codec

[![NPM version](https://img.shields.io/npm/v/@cloudy-ts/string-codec/latest.svg)](https://www.npmjs.com/package/@cloudy-ts/string-codec)
[![NPM downloads](https://img.shields.io/npm/dm/@cloudy-ts/string-codec.svg)](https://www.npmjs.com/package/@cloudy-ts/string-codec)

Encodes values to strings, while maintaining the original type.

## Usage

```ts
import { stringEncode, StringEncoded } from "@cloudy-ts/json-codec"

const text = stringEncode(7777n) // typeof text === StringEncoded<BigInt>
console.log(text) // "7777"
```
