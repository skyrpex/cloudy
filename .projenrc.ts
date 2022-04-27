// eslint-disable-next-line import/no-extraneous-dependencies
import { NodePackageManager } from "projen/lib/javascript";

import { DefaultNodeProject } from "./.projenrc.default-node-project.js";
import { TypeScript } from "./.projenrc.typescript.js";

const project = new DefaultNodeProject({
  name: "cloudy-cdk-lib",
  description: "Monorepo for the Cloudy packages",
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
  devDeps: ["aws-cdk-lib", "constructs"],
  releaseToNpm: true,
});

project.addFields({
  sideEffects: false,
  type: "module",
  engines: {
    node: "^14.13.1 || >=16.0.0",
  },
});

new TypeScript(project);

project.synth();
