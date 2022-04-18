# @cloudy-ts/esm-node

[![NPM version](https://img.shields.io/npm/v/@cloudy-ts/esm-node/latest.svg)](https://www.npmjs.com/package/@cloudy-ts/esm-node)
[![NPM downloads](https://img.shields.io/npm/dm/@cloudy-ts/esm-node.svg)](https://www.npmjs.com/package/@cloudy-ts/esm-node)

TypeScript and ESM node runtime powered by esbuild.

## Installation

```sh
pnpm add @cloudy-ts/esm-node
```

## Motivation

The implementation is just [antfu's esno](https://github.com/antfu/esno), but changes the esbuild target to `es2020`.

The main reason to do this fork is that esno will generate helpers that break Pulumi's function serialization when spreading objects.

## Usage

```sh
pnpm esm-node index.ts
```

Or manually:

```sh
node --loader @cloudy-ts/esm-node index.ts
```
