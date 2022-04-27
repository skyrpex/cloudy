// eslint-disable-next-line import/no-extraneous-dependencies
import { NodePackageManager } from "projen/lib/javascript";

import { DefaultNodeProject } from "./.projenrc.default-node-project.js";
import { TypeScript } from "./.projenrc.typescript.js";

const project = new DefaultNodeProject({
  name: "cloudy-cdk-lib",
  description:
    "Set of constructs for the AWS Cloud Development Kit that aim to improve the DX by providing a faster and type-safe code environment",
  defaultReleaseBranch: "main",
  packageManager: NodePackageManager.PNPM,
  deps: [
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/client-sns",
    "@aws-sdk/smithy-client",
    "@aws-sdk/types",
    "@aws-sdk/util-dynamodb",
    "@pulumi/pulumi",
    "esbuild",
    "find-up",
    "ts-toolbelt",
  ],
  peerDeps: ["aws-cdk-lib", "constructs"],
  devDeps: ["aws-cdk-lib", "constructs", "vitest"],
  releaseToNpm: true,
});

project.addFields({
  sideEffects: false,
  type: "module",
  engines: {
    node: "^14.13.1 || >=16.0.0",
  },
});

project.addPackageIgnore("docs/");
project.addPackageIgnore(".projenrc*");

const exports = [
  "assertions",
  "aws-dynamodb",
  "aws-lambda",
  "aws-lambda",
  "aws-sns",
  "aws-sns",
  "aws-sqs",
  "client-dynamodb",
  "client-sns",
];
new TypeScript(project, {
  entries: [
    "src/index.ts",
    ...exports.map((path) => `src/${path}/index.ts`),
    // "src/assertions/index.ts",
    // "src/aws-dynamodb/index.ts",
    // "src/aws-lambda/index.ts",
    // "src/aws-lambda-event-sources/index.ts",
    // "src/aws-sns/index.ts",
    // "src/aws-sns-subscriptions/index.ts",
    // "src/aws-sqs/index.ts",
    // "src/client-dynamodb/index.ts",
    // "src/client-sns/index.ts",
  ],
});

const libdir = "lib";
project.package.addField("publishConfig", {
  main: `./${libdir}/index.cjs`,
  types: `./${libdir}/index.d.ts`,
  exports: {
    ".": `./${libdir}/index.js`,
    // eslint-disable-next-line unicorn/no-array-reduce
    ...exports.reduce((exports, path) => {
      return {
        ...exports,
        [`./${path}`]: `./${libdir}/${path}/index.js`,
      };
    }, {}),
  },
});

project.synth();
