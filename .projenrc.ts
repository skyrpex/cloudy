// eslint-disable-next-line import/no-extraneous-dependencies
import { JsonFile } from "projen";
// eslint-disable-next-line import/no-extraneous-dependencies
import { NodePackageManager } from "projen/lib/javascript";

import { DefaultNodeProject } from "./.projenrc.default-node-project.js";
import { Turborepo } from "./.projenrc.turborepo.js";
import { TypeScript } from "./.projenrc.typescript.js";
import { WorkspaceProject } from "./.projenrc.workspace-project.js";

const project = new DefaultNodeProject({
  name: "@cloudy-ts/monorepo",
  defaultReleaseBranch: "main",
  packageManager: NodePackageManager.PNPM,
  // packageManager: NodePackageManager.YARN,
  eslint: {
    devFiles: ["**/build.config.ts"],
  },
});

// project.addGitIgnore("/.yarn/cache/*");

// Use Cloudy's esm-node to run projen.
project.addDevDeps("@cloudy-ts/esm-node");
project.defaultTask?.exec(`esm-node .projenrc.ts`);

// Use Cloudy's ESLint plugin.
project.addDevDeps("@cloudy-ts/eslint-plugin");
project.eslint.addPlugins("@cloudy-ts");
project.eslint.addRules({
  "@cloudy-ts/extensions": ["error", "ignorePackages", { ".ts": "never" }],
});

// Ignore CDK and unbuild outputs.
project.gitignore.exclude("cdk.out/", "dist/");
project.prettier?.ignoreFile?.addPatterns("cdk.out/", "dist/");
project.eslint.ignoreFile.addPatterns("cdk.out/", "dist/");

// Setup commitlint.
project.addDevDeps("@commitlint/cli", "@commitlint/config-conventional");
new JsonFile(project, ".commitlintrc.json", {
  obj: {
    extends: ["@commitlint/config-conventional"],
  },
});

// Setup lint-staged.
project.addDevDeps("lint-staged");
new JsonFile(project, ".lintstagedrc.json", {
  obj: {
    "*.{js,mjs,cjs,ts,mts,cts}": ["eslint --fix", "prettier --write"],
  },
});

// Setup husky.
project.addDevDeps("husky");

// Setup Turborepo.
new Turborepo(project, {
  workspaces: ["packages/*", "tools/*", "playground"],
  pipeline: {
    release: {
      dependsOn: ["^release"],
      outputs: ["dist/**"],
    },
    build: {
      dependsOn: ["^build"],
      outputs: ["dist/**"],
    },
    test: {
      dependsOn: ["@cloudy-ts/esm-node#build"],
      outputs: [],
    },
    lint: {
      dependsOn: ["@cloudy-ts/eslint-plugin#build"],
      outputs: [],
    },
  },
});

// Setup TypeScript.
new TypeScript(project, {
  tsconfig: {
    paths: {
      "@cloudy-ts/*": ["./packages/*", "./tools/*"],
    },
  },
});

const eslintPlugin = new WorkspaceProject(project, {
  name: "@cloudy-ts/eslint-plugin",
  outdir: "tools/eslint-plugin",
  deps: ["eslint-module-utils", "is-core-module"],
  build: {
    entries: ["src/index"],
    emitTypes: false,
    emitCommonjs: true,
  },
  lint: false,
});
eslintPlugin.addFields({
  main: "./dist/index.cjs",
  module: "./dist/index.mjs",
  exports: {
    ".": {
      require: "./dist/index.cjs",
      import: "./dist/index.mjs",
    },
  },
});

const esmNode = new WorkspaceProject(project, {
  name: "@cloudy-ts/esm-node",
  outdir: "tools/esm-node",
  deps: ["cross-spawn", "esbuild", "node-fetch", "semver"],
  build: {
    entries: ["src/index"],
    emitTypes: false,
    sampleFiles: false,
  },
  autoDetectBin: false,
  bin: {
    "esm-node": "./bin/esm-node.js",
  },
});
esmNode.addFields({
  files: ["dist/", "bin/"],
  module: "./src/index.js",
  exports: {
    ".": {
      import: "./src/index.js",
    },
  },
});

new WorkspaceProject(project, {
  name: "@cloudy-ts/opaque-type",
  outdir: "packages/opaque-type",
});

new WorkspaceProject(project, {
  name: "@cloudy-ts/json-codec",
  outdir: "packages/json-codec",
  deps: ["@cloudy-ts/opaque-type"],
  ava: true,
});

new WorkspaceProject(project, {
  name: "@cloudy-ts/string-codec",
  outdir: "packages/string-codec",
  deps: ["@cloudy-ts/opaque-type"],
});

new WorkspaceProject(project, {
  name: "@cloudy-ts/util-command-proxy",
  outdir: "packages/util-command-proxy",
  deps: ["@aws-sdk/smithy-client", "@aws-sdk/types"],
});

new WorkspaceProject(project, {
  name: "@cloudy-ts/util-dynamodb",
  outdir: "packages/util-dynamodb",
  deps: [
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/util-dynamodb",
    "@cloudy-ts/string-codec",
  ],
});

new WorkspaceProject(project, {
  name: "@cloudy-ts/client-dynamodb",
  outdir: "packages/client-dynamodb",
  deps: [
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/smithy-client",
    "@aws-sdk/types",
    "@aws-sdk/util-dynamodb",
    "ts-toolbelt",
    "@cloudy-ts/util-command-proxy",
    "@cloudy-ts/opaque-type",
    "@cloudy-ts/string-codec",
    "@cloudy-ts/util-dynamodb",
  ],
  peerDeps: ["@cloudy-ts/cdk"],
  devDeps: ["@cloudy-ts/cdk"],
});

new WorkspaceProject(project, {
  name: "@cloudy-ts/client-sns",
  outdir: "packages/client-sns",
  deps: [
    "@aws-sdk/client-sns",
    "@aws-sdk/smithy-client",
    "@aws-sdk/types",
    "ts-toolbelt",
    "@cloudy-ts/util-command-proxy",
  ],
  peerDeps: ["@cloudy-ts/cdk"],
  devDeps: ["@cloudy-ts/cdk"],
});

new WorkspaceProject(project, {
  name: "@cloudy-ts/cdk",
  outdir: "packages/cdk",
  deps: [
    "@aws-sdk/util-dynamodb",
    "@cloudy-ts/json-codec",
    "@cloudy-ts/opaque-type",
    "@cloudy-ts/string-codec",
    "@cloudy-ts/util-dynamodb",
    "@pulumi/pulumi",
    "esbuild",
    "find-up",
    "ts-toolbelt",
  ],
  peerDeps: ["aws-cdk-lib", "constructs"],
  devDeps: ["@aws-sdk/client-dynamodb", "aws-cdk-lib", "constructs"],
});

const playground = new WorkspaceProject(project, {
  name: "@cloudy-ts/playground",
  outdir: "playground",
  deps: [
    "aws-cdk",
    "aws-cdk-lib",
    "constructs",
    "@cloudy-ts/cdk",
    "@cloudy-ts/client-dynamodb",
    "@cloudy-ts/client-sns",
    "@cloudy-ts/esm-node",
  ],
  build: false,
});
playground.eslint?.addIgnorePattern("cdk.out/");

const examples = new WorkspaceProject(project, {
  name: "@cloudy-ts/examples",
  outdir: "examples",
  deps: [
    "aws-cdk",
    "aws-cdk-lib",
    "constructs",
    "@cloudy-ts/cdk",
    "@cloudy-ts/client-dynamodb",
    "@cloudy-ts/client-sns",
    "@cloudy-ts/esm-node",
  ],
  devDeps: ["typescript"],
  build: false,
});
examples.eslint?.addIgnorePattern("cdk.out/");
examples.testTask.exec("tsc --noEmit");
new JsonFile(examples, "tsconfig.json", {
  obj: {
    extends: "../tsconfig.json",
    include: ["**/*.ts"],
    exclude: ["**/node_modules/**/*"],
  },
});

project.synth();
