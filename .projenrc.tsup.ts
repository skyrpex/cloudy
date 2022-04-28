import { Component, Project } from "projen";
import { NodeProject } from "projen/lib/javascript";

export interface TsupOptions {
  libdir: string;
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

    nodeProject.addDevDeps("tsup");

    nodeProject.addFields({
      tsup: {
        entry: options.entries,
        splitting: false,
        sourcemap: true,
        clean: true,
        dts: true,
        target: "node14",
        format: ["esm", "cjs"],
      },
    });

    nodeProject.compileTask.reset();
    nodeProject.compileTask.exec("tsup --out-dir=lib");
    nodeProject.postCompileTask.exec("mv lib/* .");

    // nodeProject.package.addField("publishConfig", {
    //   main: `./${options.libdir}/index.cjs`,
    //   module: `./${options.libdir}/index.js`,
    //   types: `./${options.libdir}/index.d.ts`,
    //   exports: {
    //     ".": {
    //       require: `./${options.libdir}/index.cjs`,
    //       import: `./${options.libdir}/index.js`,
    //       types: `./${options.libdir}/index.d.ts`,
    //     },
    //   },
    // });
  }
}
