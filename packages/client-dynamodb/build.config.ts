import { defineBuildConfig } from "unbuild";

import {
  dependencies,
  devDependencies,
  peerDependencies,
} from "./package.json";

export default defineBuildConfig({
  entries: ["src/index"],
  externals: [
    ...Object.keys(dependencies),
    ...Object.keys(devDependencies),
    ...Object.keys(peerDependencies),
  ],
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
