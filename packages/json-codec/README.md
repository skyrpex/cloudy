# @cloudy-ts/json-codec

[![NPM version](https://img.shields.io/npm/v/@cloudy-ts/json-codec/latest.svg)](https://www.npmjs.com/package/@cloudy-ts/json-codec)
[![NPM downloads](https://img.shields.io/npm/dm/@cloudy-ts/json-codec.svg)](https://www.npmjs.com/package/@cloudy-ts/json-codec)

Encode and decode JSON objects while maintaining the original type.

## Installation

```sh
pnpm add @cloudy-ts/json-codec
```

## Usage

```ts
import { jsonEncode, jsonDecode, JsonEncoded } from "@cloudy-ts/json-codec";

const detailsJson = jsonEncode({ name: "Codec", description: "JSON" });
// typeof detailsJson === JsonEncoded<{ name: string; description: string; }>
console.log(string); // '{"name":"Codec","description":"JSON"}'

const details = jsonDecode(detailsJson);
// typeof details === { name: string; description: string; }
```
