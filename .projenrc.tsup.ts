import { Component, JsonFile, Project, SourceCode } from "projen";
import { NodeProject, Prettier } from "projen/lib/javascript";

import { Eslint } from "./.projenrc.eslint.js";

export interface TsupOptions {
  entries: string[];
}

export class Tsup extends Component {
  public static of(project: Project): Tsup | undefined {
    const isTsup = (c: Component): c is Tsup => c instanceof Tsup;
    // eslint-disable-next-line unicorn/no-array-callback-reference
    return project.components.find(isTsup);
  }

  constructor(public readonly nodeProject: NodeProject, options: TsupOptions) {
    super(nodeProject);

    const { entries } = options;

    nodeProject.addGitIgnore("dist/");
    nodeProject.package.addField("files", ["dist/"]);

    nodeProject.addDevDeps("tsup");

    nodeProject.addFields({
      tsup: {
        entry: entries,
        sourcemap: true,
        clean: true,
        dts: true,
        target: "node14",
        format: ["esm", "cjs"],
      },
    });

    // nodeProject.addTask("unbuild", {
    //   exec: "unbuild",
    // });
    nodeProject.removeTask("build");
    nodeProject.addTask("build", { exec: "tsup" });
    // nodeProject.buildTask.exec("unbuild");

    nodeProject.package.addField("publishConfig", {
      main: "./dist/index.cjs",
      module: "./dist/index.mjs",
      types: "./dist/index.d.ts",
      exports: {
        ".": {
          require: "./dist/index.cjs",
          import: "./dist/index.mjs",
          types: "./dist/index.d.ts",
        },
      },
    });

    Eslint.of(nodeProject)?.addIgnorePattern("dist/");
    Prettier.of(nodeProject)?.addIgnorePattern("dist/");
  }
}
