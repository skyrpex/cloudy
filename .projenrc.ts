import * as path from "node:path";

// eslint-disable-next-line import/no-extraneous-dependencies
import { JsonFile, Projenrc, SampleFile } from "projen";
// eslint-disable-next-line import/no-extraneous-dependencies
import { NodePackageManager } from "projen/lib/javascript";

import { DefaultNodeProject } from "./.projenrc.default-node-project.js";
import { Turborepo } from "./.projenrc.turborepo.js";
import { TypeScript } from "./.projenrc.typescript.js";
import { WorkspaceProject } from "./.projenrc.workspace-project.js";

///////////////////////////////////////////////////////////////////////////////
const project = new DefaultNodeProject({
  name: "@cloudy-ts/monorepo",
  description: "Monorepo for the Cloudy packages",
  defaultReleaseBranch: "main",
  packageManager: NodePackageManager.PNPM,
  github: false,
});

project.testTask.exec("turbo run lint:fix test");
project.compileTask.exec("turbo run lint:fix test build");

// Use vite-node to run projen.
project.addDevDeps("vite-node");
project.defaultTask?.exec(`vite-node .projenrc.ts`);

// Ignore CDK and build outputs from versioning.
project.gitignore.exclude("cdk.out/", "dist/");

// Ignore workspace directories from formatting and linting at the workspace level.
for (const pattern of ["examples/", "packages/", "playground/"]) {
  project.prettier?.ignoreFile?.addPatterns(pattern);
  project.eslint.ignoreFile.addPatterns(pattern);
}

// Setup Turborepo.
new Turborepo(project, {
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
      dependsOn: [],
      outputs: [],
    },
    format: {
      dependsOn: [],
      outputs: [],
    },
    "format:fix": {
      dependsOn: [],
      outputs: [],
    },
    lint: {
      dependsOn: ["format"],
      outputs: [],
    },
    "lint:fix": {
      dependsOn: ["format:fix"],
      outputs: [],
    },
  },
  forAllWorkspaces(workspace) {
    const outdir = path.relative(workspace.outdir, project.outdir);
    new JsonFile(workspace, "tsconfig.json", {
      obj: {
        extends: `${outdir}/tsconfig.json`,
      },
    });
  },
});

// Setup TypeScript.
new TypeScript(project, {
  tsconfig: {
    paths: {
      "@cloudy-ts/*": ["./packages/*"],
    },
  },
});

///////////////////////////////////////////////////////////////////////////////
new WorkspaceProject(project, {
  name: "@cloudy-ts/opaque-type",
  outdir: "packages/opaque-type",
  description: "Implement opaque types in TypeScript",
});

///////////////////////////////////////////////////////////////////////////////
new WorkspaceProject(project, {
  name: "@cloudy-ts/json-codec",
  outdir: "packages/json-codec",
  description: "Encode and decode JSON objects while maintaining the original type",
  deps: ["@cloudy-ts/opaque-type"],
  ava: true,
});

///////////////////////////////////////////////////////////////////////////////
new WorkspaceProject(project, {
  name: "@cloudy-ts/string-codec",
  outdir: "packages/string-codec",
  description: "Encode values to strings, while maintaining the original type",
  deps: ["@cloudy-ts/opaque-type"],
});

///////////////////////////////////////////////////////////////////////////////
new WorkspaceProject(project, {
  name: "@cloudy-ts/util-command-proxy",
  outdir: "packages/util-command-proxy",
  deps: ["@aws-sdk/smithy-client", "@aws-sdk/types"],
});

///////////////////////////////////////////////////////////////////////////////
new WorkspaceProject(project, {
  name: "@cloudy-ts/util-dynamodb",
  outdir: "packages/util-dynamodb",
  description: "Utilities for DynamoDB clients",
  deps: [
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/util-dynamodb",
    "@cloudy-ts/string-codec",
  ],
});

///////////////////////////////////////////////////////////////////////////////
new WorkspaceProject(project, {
  name: "@cloudy-ts/client-dynamodb",
  outdir: "packages/client-dynamodb",
  description: "Cloudy SDK for JavaScript Dynamodb Client",
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

///////////////////////////////////////////////////////////////////////////////
new WorkspaceProject(project, {
  name: "@cloudy-ts/client-sns",
  outdir: "packages/client-sns",
  description: "Cloudy SDK for JavaScript SNS Client",
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

///////////////////////////////////////////////////////////////////////////////
const cdk = new WorkspaceProject(project, {
  name: "@cloudy-ts/cdk",
  outdir: "packages/cdk",
  description: "Set of constructs for the AWS Cloud Development Kit that aim to improve the DX by providing a faster and type-safe code environment",
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
  devDeps: [
    "@aws-sdk/client-dynamodb",
    "aws-cdk-lib",
    "constructs",
    "typescript",
  ],
});

// Test.
cdk.addDevDeps("vitest", "c8");
cdk.testTask.exec("vitest run --coverage");
cdk.addTask("dev").exec("vitest");

///////////////////////////////////////////////////////////////////////////////
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
    "cloudy-node",
  ],
  devDeps: ["typescript"],
  build: false,
});
examples.eslint?.addIgnorePattern("cdk.out/");
examples.testTask.exec("tsc --noEmit");

for (const example of [
  "1-hello-world",
  "2-hello-world-alternate",
  "3-publish-to-topic",
]) {
  new SampleFile(examples, `src/${example}/index.ts`, {
    contents: [
      'import * as cdk from "@cloudy-ts/cdk";',
      "",
      'import { buildExampleStackName } from "../util.js";',
      "",
      "const app = new cdk.App();",
      "const stack = new cdk.Stack(app, buildExampleStackName(import.meta.url));",
      "",
    ].join("\n"),
  });

  new JsonFile(examples, `src/${example}/cdk.json`, {
    obj: {
      app: "pnpx cloudy-node index.ts",
    },
  });
}
// new JsonFile(examples, "tsconfig.json", {
//   obj: {
//     extends: "../tsconfig.json",
//     include: ["**/*.ts"],
//     exclude: ["**/node_modules/**/*"],
//   },
// });

///////////////////////////////////////////////////////////////////////////////
project.synth();
