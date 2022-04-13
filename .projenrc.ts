import { NodePackageManager } from "projen/lib/javascript"

import { DefaultNodeProject } from "./.projenrc.default-node-project.js"
import { Turborepo } from "./.projenrc.turborepo.js"
import { TypeScript } from "./.projenrc.typescript.js"
import { WorkspaceProject } from "./.projenrc.workspace-project.js"

const project = new DefaultNodeProject({
  name: "@cloudy-ts/monorepo",
  defaultReleaseBranch: "main",
  packageManager: NodePackageManager.YARN,
  devDeps: [
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "esbuild",
    "husky",
    "lint-staged",
  ],
})

// Use esm-node to run projen.
project.addDevDeps("@cloudy-ts/esm-node")
project.defaultTask?.exec(`esm-node .projenrc.ts`)

// Use Cloudy's ESLint plugin.
project.addDevDeps("@cloudy-ts/eslint-plugin")
project.eslint.addPlugins("@cloudy-ts")
project.eslint.addRules({
  "@cloudy-ts/extensions": ["error", "ignorePackages", { ".ts": "never" }],
})

// Ignore CDK and build outputs.
project.gitignore.exclude("cdk.out/", "dist/")
project.prettier?.ignoreFile?.addPatterns("cdk.out/", "dist/")
project.eslint.ignoreFile.addPatterns("cdk.out/", "dist/")

// Setup Turborepo.
new Turborepo(project, {
  additionalWorkspaces: ["packages/*", "tools/*", "playground"],
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
})

// Setup TypeScript.
new TypeScript(project, {
  tsconfig: {
    paths: {
      "@cloudy-ts/*": ["./packages/*", "./tools/*"],
    },
  },
})

// new WorkspaceProject(project, {
//   name: "@chronosource-ts/test-1",
//   outdir: "tools/test-1",
//   deps: [],
// })

// new WorkspaceProject(project, {
//   name: "@chronosource-ts/test-2",
//   outdir: "tools/test-2",
//   deps: [],
// })

project.synth()
