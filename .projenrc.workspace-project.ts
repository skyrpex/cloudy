import { NodeProject, NodeProjectOptions } from "projen/lib/javascript";

export class WorkspaceProject extends NodeProject {
  constructor(
    parent: NodeProject,
    options: Omit<
      NodeProjectOptions,
      "parent" | "defaultReleaseBranch" | "packageManager"
    >,
  ) {
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
  }
}
