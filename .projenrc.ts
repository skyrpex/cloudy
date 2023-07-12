// eslint-disable-next-line import/no-extraneous-dependencies
import { JsonFile, SampleFile, TextFile, github } from "projen";
import {
  NodePackageManager,
  NodeProject,
  TrailingComma,
  TypeScriptModuleResolution,
} from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";

import { TypeScript } from "./.projenrc.typescript.js";

const project = new TypeScriptProject({
  name: "cloudy-cdk-lib",
  description:
    "Set of constructs for the AWS Cloud Development Kit that aim to improve the DX by providing a faster and type-safe code environment",
  defaultReleaseBranch: "main",

  deps: [
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/client-sns",
    "@aws-sdk/smithy-client",
    "@aws-sdk/types",
    "@aws-sdk/util-dynamodb",
    "esbuild",
    "find-up",
    "ts-toolbelt",
    "@pulumi/pulumi@3.33",
  ],
  peerDeps: ["aws-cdk-lib", "constructs"],
  devDeps: ["aws-cdk-lib", "constructs"],

  packageManager: NodePackageManager.PNPM,
  releaseToNpm: true,
  autoApproveUpgrades: true,
  autoApproveOptions: {
    allowedUsernames: ["skyrpex", "skyrpex-bot[bot]"],
  },
  githubOptions: {
    projenCredentials: github.GithubCredentials.fromApp(),
  },
  projenrcJs: false,
  sampleCode: false,

  prettier: true,
  prettierOptions: {
    settings: {
      trailingComma: TrailingComma.ALL,
    },
  },

  jest: false,

  tsconfig: {
    compilerOptions: {
      module: "ES2022",
      moduleResolution: TypeScriptModuleResolution.NODE,
      lib: ["DOM", "ES2020"],
      noUncheckedIndexedAccess: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      target: "ES2020",
    },
  },
  tsconfigDev: {
    include: ["**/*.test.ts", "**/.*.ts"],
    compilerOptions: {},
  },
});

project.addFields({
  sideEffects: false,
  type: "module",
  engines: {
    node: "^14.13.1 || >=16.0.0",
  },
});

project.addPackageIgnore("docs/");
project.addPackageIgnore(".prettierignore");
project.addPackageIgnore(".prettierrc*");
project.addPackageIgnore(".*.ts");
project.addPackageIgnore("*.ts");
project.addPackageIgnore("pnpm-lock.yaml");

// Compile and export.
const entries = [
  "assertions",
  "aws-dynamodb",
  "aws-lambda",
  "aws-lambda-event-sources",
  "aws-sns",
  "aws-sns-subscriptions",
  "aws-sqs",
  "client-dynamodb",
  "client-sns",
];
new TypeScript(project, {
  entries: ["src/index.ts", ...entries.map((path) => `src/${path}/index.ts`)],
});
project.addFields({
  main: "./index.cjs",
  types: "./index.d.ts",
  module: "./index.js",
  exports: {
    ".": "./index.js",
    // eslint-disable-next-line unicorn/no-array-reduce
    ...entries.reduce((exports, path) => {
      return {
        ...exports,
        [`./${path}`]: `./${path}/index.js`,
      };
    }, {}),
  },
});
project.addGitIgnore("*.js");
project.addGitIgnore("*.js.map");
project.addGitIgnore("*.cjs");
project.addGitIgnore("*.cjs.map");
project.addGitIgnore("*.d.ts");

// Tests.
project.addDevDeps("vitest", "@vitest/coverage-v8");
project.testTask.exec("vitest run --coverage --passWithNoTests --dir src");
project.addPackageIgnore("coverage/");

// Lint.
project.addDevDeps("eslint-plugin-unicorn", "@cloudy-ts/eslint-plugin");
project.eslint?.addExtends(
  "plugin:unicorn/recommended",
  "plugin:@cloudy-ts/recommended",
);
project.eslint?.addRules({
  "unicorn/prevent-abbreviations": [
    "error",
    {
      replacements: {
        props: false,
      },
    },
  ],
});
new TextFile(project, ".editorconfig", {
  lines: [
    "root = true",
    "",
    "[*]",
    "indent_style = space",
    "indent_size = 2",
    "end_of_line = lf",
    "charset = utf-8",
    "trim_trailing_whitespace = true",
    "insert_final_newline = true",
    "",
    "[*.md]",
    "trim_trailing_whitespace = false",
    "",
  ],
});
project.addPackageIgnore(".editorconfig");

///////////////////////////////////////////////////////////////////////////////
project.addPackageIgnore("examples/");
const examples = new NodeProject({
  parent: project,
  name: "examples",
  outdir: "examples",
  deps: [
    "aws-cdk",
    "aws-cdk-lib",
    "constructs",
    "cloudy-cdk-lib@link:..",
    "tsx",
  ],
  devDeps: ["typescript"],
  defaultReleaseBranch: "main",
  packageManager: NodePackageManager.PNPM,
  jest: false,
});
new JsonFile(examples, `.eslintrc.json`, {
  obj: {
    root: true,
    extends: ["../eslintrc.json"],
  },
});
new JsonFile(examples, `tsconfig.json`, {
  obj: {
    extends: "../tsconfig.json",
  },
});
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
      app: "pnpm exec tsx index.ts",
    },
  });
}

project.synth();
