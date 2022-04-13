import {
  NodePackageManager,
  NodeProject,
  NodeProjectOptions,
  TrailingComma,
} from "projen/lib/javascript"

import { Eslint } from "./.projenrc.eslint.js"
import { Turborepo } from "./.projenrc.turborepo.js"
import { TypeScript } from "./.projenrc.typescript.js"
import { WorkspaceProject } from "./.projenrc.workspace-project.js"

class MyProject extends NodeProject {
  constructor(options: NodeProjectOptions) {
    super({
      jest: false,
      buildWorkflow: false,
      depsUpgrade: false,
      entrypoint: "",
      github: false,
      package: false,
      prettier: true,
      prettierOptions: {
        settings: {
          tabWidth: 2,
          trailingComma: TrailingComma.ALL,
          semi: false,
        },
      },
      projenrcJs: false,
      publishDryRun: true,
      publishTasks: false,
      release: false,
      stale: false,
      // vscode: false,
      ...options,
    })

    this.gitignore.exclude("dist/", "cdk.out/")
    this.prettier?.ignoreFile?.addPatterns("node_modules/", "cdk.out/", "dist/")

    // this.addDevDeps("@cloudy-ts/eslint-plugin", "eslint-plugin-unicorn")
    const eslint = new Eslint(this, {
      pathGroups: [
        {
          pattern: "@cloudy-ts/**",
          group: "external",
          position: "after",
        },
      ],
      devFiles: [".projenrc*.ts", "**/*.test.ts"],
    })

    this.addDevDeps("@cloudy-ts/eslint-plugin")
    eslint.addPlugins("@cloudy-ts")
    eslint.addRules({
      "@cloudy-ts/extensions": ["error", "ignorePackages", { ".ts": "never" }],
    })
    eslint.ignoreFile.addPatterns("cdk.out/", "dist/")

    this.addDevDeps("@cloudy-ts/esm-node")
    this.defaultTask?.exec(`esm-node .projenrc.ts`)
  }
}

const project = new MyProject({
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

new Turborepo(project, {
  additionalWorkspaces: ["packages/*", "tools/*", "cloudy/**/*", "playground"],
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

new TypeScript(project, {
  tsconfig: {
    paths: {
      "@chronosource-ts/*": ["./packages/*", "./tools/*"],
      "@cloudy-ts/*": ["./cloudy/packages/*", "./cloudy/tools/*"],
    },
  },
})

new WorkspaceProject(project, {
  name: "@chronosource-ts/test-1",
  outdir: "tools/test-1",
  deps: [],
})

new WorkspaceProject(project, {
  name: "@chronosource-ts/test-2",
  outdir: "tools/test-2",
  deps: [],
})

project.synth()
