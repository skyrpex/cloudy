import * as fs from "node:fs";

import { defineBuildConfig } from "unbuild";

const packageJson = JSON.parse(fs.readFileSync("./package.json").toString());

export default defineBuildConfig({
  entries: ["src/index"],
  externals: [
    ...Object.keys(packageJson.dependencies ?? []),
    ...Object.keys(packageJson.devDependencies ?? []),
    ...Object.keys(packageJson.peerDependencies ?? []),
  ],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
