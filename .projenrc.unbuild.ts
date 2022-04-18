import { Component, JsonFile, Project, SourceCode } from "projen";
import { NodeProject, Prettier } from "projen/lib/javascript";
import { Eslint } from "./.projenrc.eslint.js";

export interface UnbuildOptions {
  entries: string[];
  emitTypes?: boolean;
  emitCommonjs?: boolean;
}

export class Unbuild extends Component {
  public static of(project: Project): Unbuild | undefined {
    const isUnbuild = (c: Component): c is Unbuild => c instanceof Unbuild;
    // eslint-disable-next-line unicorn/no-array-callback-reference
    return project.components.find(isUnbuild);
  }

  constructor(
    public readonly nodeProject: NodeProject,
    options: UnbuildOptions,
  ) {
    super(nodeProject);

    nodeProject.addGitIgnore("dist/");
    nodeProject.package.addField("files", ["dist/"]);

    nodeProject.addDevDeps("unbuild");

    // nodeProject.addTask("unbuild", {
    //   exec: "unbuild",
    // });
    nodeProject.removeTask("build");
    nodeProject.addTask("build", {
      exec: "unbuild",
    });
    // nodeProject.buildTask.exec("unbuild");

    const { entries, emitCommonjs = false, emitTypes = true } = options;
    nodeProject.package.addField("publishConfig", {
      main: emitCommonjs ? "./dist/index.cjs" : undefined,
      module: "./dist/index.mjs",
      types: emitTypes ? "./dist/index.d.ts" : undefined,
      exports: {
        ".": {
          require: emitCommonjs ? "./dist/index.cjs" : undefined,
          import: "./dist/index.mjs",
          types: emitTypes ? "./dist/index.d.ts" : undefined,
        },
      },
    });

    const source = new SourceCode(nodeProject, "build.config.ts");
    source.line(
      '// ~~ Generated by projen. To modify, edit .projenrc.js and run "npx projen".',
    );
    source.line("/* eslint-disable unicorn/no-abusive-eslint-disable */");
    source.line("/* eslint-disable */");
    source.line('import * as fs from "node:fs";');
    source.line();
    source.line('import { defineBuildConfig } from "unbuild";');
    source.line();
    source.line(
      'const packageJson = JSON.parse(fs.readFileSync("./package.json").toString());',
    );
    source.line();
    source.open("export default defineBuildConfig({");
    source.line(`entries: ${JSON.stringify(entries)},`);
    source.open("externals: [");
    source.line("...Object.keys(packageJson.dependencies ?? []),");
    source.line("...Object.keys(packageJson.devDependencies ?? []),");
    source.line("...Object.keys(packageJson.peerDependencies ?? []),");
    source.close("],");
    if (emitTypes) {
      source.line("declaration: true,");
    }
    if (emitCommonjs) {
      source.open("rollup: {");
      source.line("emitCJS: true,");
      source.close("},");
    }
    source.close("});");
    source.line();

    Eslint.of(nodeProject)?.addIgnorePattern("dist/");
    Prettier.of(nodeProject)?.addIgnorePattern("dist/");
  }
}