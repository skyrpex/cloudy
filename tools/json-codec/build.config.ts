import * as fs from "node:fs"

import { defineBuildConfig } from "unbuild"

import { dependencies, devDependencies } from "./package.json"

export default defineBuildConfig({
  entries: ["src/index"],
  externals: [...Object.keys(dependencies), ...Object.keys(devDependencies)],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
})
