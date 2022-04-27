import { TextFile } from "projen";
import {
  NodeProject,
  NodeProjectOptions,
  TrailingComma,
} from "projen/lib/javascript";

import { Eslint } from "./.projenrc.eslint.js";

interface DefaultNodeProjectOptions extends NodeProjectOptions {
  eslint?: {
    devFiles?: string[];
  };
}

export class DefaultNodeProject extends NodeProject {
  public readonly eslint: Eslint;

  constructor(options: DefaultNodeProjectOptions) {
    super({
      jest: false,
      // buildWorkflow: false,
      // depsUpgrade: false,
      entrypoint: "",
      // github: false,
      // package: false,
      prettier: true,
      prettierOptions: {
        settings: {
          trailingComma: TrailingComma.ALL,
        },
      },
      projenrcJs: false,
      // publishDryRun: true,
      // publishTasks: false,
      // release: false,
      // stale: false,
      // vscode: false,
      ...options,
    });

    // this.package.addField("type", "module");
    // this.package.addField("sideEffects", false);

    this.prettier?.ignoreFile?.addPatterns("node_modules/");

    this.eslint = new Eslint(this, {
      prettier: options.prettier ?? true,
      pathGroups: this.packageScope
        ? [
            {
              pattern: `${this.packageScope}/**`,
              group: "external",
              position: "after",
            },
          ]
        : [],
      devFiles: [
        "**/.projenrc*.ts",
        "**/*.test.ts",
        ...(options.eslint?.devFiles ?? []),
      ],
    });

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
    });
    this.addPackageIgnore(".editorconfig");
    this.addPackageIgnore(".prettierignore");
    this.addPackageIgnore(".prettierrc*");
  }

  private get packageScope() {
    const result = this.package.packageName.match(/^(@.*?)\//);
    if (result) {
      return result[1];
    }
  }
}
