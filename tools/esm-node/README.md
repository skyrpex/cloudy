# @cloudy-ts/esm-node

TypeScript and ESM node runtime powered by esbuild.

## Motivation

The implementation is just [antfu's esno](https://github.com/antfu/esno), but changes the esbuild target to `es2020`.

The main reason to do this fork is that esno will generate helpers that break Pulumi's function serialization when spreading objects.

## Usage

```sh
yarn esm-node index.ts
```

Or manually:

```sh
node --loader @cloudy-ts/esm-node index.ts
```
