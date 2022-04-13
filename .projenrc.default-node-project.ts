import { TextFile } from "projen"
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

    new TextFile(this, ".editorconfig", {
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
    })
  }

  private get packageScope() {
    const result = this.package.packageName.match(/^(@.*?)\//)
    if (result) {
      return result[1]
    }
  }
}
