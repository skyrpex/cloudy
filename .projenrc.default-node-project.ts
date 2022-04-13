import {
  NodePackageManager,
  NodeProject,
  NodeProjectOptions,
  TrailingComma,
} from "projen/lib/javascript"

import { Eslint } from "./.projenrc.eslint.js"

export class DefaultNodeProject extends NodeProject {
  public readonly eslint: Eslint

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
      vscode: false,
      ...options,
    })

    this.prettier?.ignoreFile?.addPatterns("node_modules/")

    this.eslint = new Eslint(this, {
      pathGroups: this.packageScope
        ? [
            {
              pattern: `${this.packageScope}/**`,
              group: "external",
              position: "after",
            },
          ]
        : [],
      devFiles: [".projenrc*.ts", "**/*.test.ts"],
    })
    // this.addDevDeps("@cloudy-ts/eslint-plugin")
    // eslint.addPlugins("@cloudy-ts")
    // eslint.addRules({
    //   "@cloudy-ts/extensions": ["error", "ignorePackages", { ".ts": "never" }],
    // })
    // eslint.ignoreFile.addPatterns("cdk.out/", "dist/")

    // this.addDevDeps("@cloudy-ts/esm-node")
    // this.defaultTask?.exec(`esm-node .projenrc.ts`)
  }

  private get packageScope() {
    const result = this.package.packageName.match(/^(@.*?)\//)
    if (result) {
      return result[1]
    }
  }
}
