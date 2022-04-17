import { SampleFile, TextFile } from "projen";
import { NodeProject, NodeProjectOptions } from "projen/lib/javascript";

import { Unbuild } from "./.projenrc.unbuild.js";

export interface WorkspaceProjectOptions
  extends Omit<
    NodeProjectOptions,
    "parent" | "defaultReleaseBranch" | "packageManager" | "jest"
  > {
  ava?: boolean;
  lint?: boolean;
}

export class WorkspaceProject extends NodeProject {
  constructor(parent: NodeProject, options: WorkspaceProjectOptions) {
    super({
      parent,
      defaultReleaseBranch: parent.release?.branches[0] ?? "main",
      packageManager: parent.package.packageManager,
      jest: false,
      buildWorkflow: false,
      depsUpgrade: false,
      entrypoint: "",
      github: false,
      package: false,
      projenrcJs: false,
      publishTasks: false,
      release: false,
      stale: false,
      projenDevDependency: false,
      ...options,
      readme: {
        contents: [
          `# ${options.name}`,
          "",
          `[![NPM version](https://img.shields.io/npm/v/${options.name}/latest.svg)](https://www.npmjs.com/package/${options.name})`,
          `[![NPM downloads](https://img.shields.io/npm/dm/${options.name}.svg)](https://www.npmjs.com/package/${options.name})`,
          "",
          "## Installation",
          "",
          "```sh",
          `pnpm add ${options.name}`,
          "```",
          "",
          "## Usage",
          "",
          "```ts",
          `import {} from "${options.name}"`,
          "```",
          "",
        ].join("\n"),
      },
    });

    for (const task of [
      "build",
      "clobber",
      "compile",
      "eject",
      "default",
      "package",
      "post-compile",
      "pre-compile",
      // "test",
      "projen",
    ]) {
      this.removeTask(task);
    }

    // this.removeScript("projen");

    this.package.addField("sideEffects", false);
    this.package.addField("type", "module");
    this.package.addField("engines", {
      node: "^14.13.1 || >=16.0.0",
    });

    new TextFile(this, "index.ts", {
      lines: [
        '// ~~ Generated by projen. To modify, edit .projenrc.js and run "npx projen".',
        'export * from "./src/index.js";',
        "",
      ],
    });

    new SampleFile(this, "src/index.ts", {
      contents: ["export {};", ""].join("\n"),
    });

    new Unbuild(this, {
      entries: ["src/index"],
    });

    if (options.lint !== false) {
      this.addDevDeps("eslint");
      this.addTask("lint", {
        exec: "eslint --ext ts .",
      });
    }

    if (options.ava) {
      this.addDevDeps("ava", "@cloudy-ts/esm-node");
      this.package.addField("ava", {
        extensions: {
          ts: "module",
        },
        nodeArguments: ["--loader=@cloudy-ts/esm-node"],
        files: ["**/*.test.ts"],
        failWithoutAssertions: false,
      });
      // this.removeTask("test");
      // this.addTask("test", {
      //   exec: "ava",
      // });
      this.testTask.exec("ava");
    }
  }
}
