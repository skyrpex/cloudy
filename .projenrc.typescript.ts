import { Component, JsonFile, Project } from "projen";
import { NodeProject, Prettier } from "projen/lib/javascript";

interface TypeScriptOptions {
  entries: string[];
  tsconfig?: {
    paths?: { [name: string]: string[] };
  };
}

export class TypeScript extends Component {
  public static of(project: Project): TypeScript | undefined {
    const isTypeScript = (c: Component): c is TypeScript =>
      c instanceof TypeScript;
    // eslint-disable-next-line unicorn/no-array-callback-reference
    return project.components.find(isTypeScript);
  }

  constructor(
    public readonly nodeProject: NodeProject,
    options: TypeScriptOptions,
  ) {
    super(nodeProject);

    const srcdir = "src" as string;
    const libdir = "lib" as string;
    nodeProject.gitignore.include(`/${srcdir}/`);
    nodeProject.npmignore?.exclude(`/${srcdir}/`);

    if (srcdir !== libdir) {
      // separated, can ignore the entire libdir
      nodeProject.gitignore.exclude(`/${libdir}`);
    } else {
      // collocated, can only ignore the compiled output
      nodeProject.gitignore.exclude(`/${libdir}/**/*.js`);
      nodeProject.gitignore.exclude(`/${libdir}/**/*.d.ts`);
    }

    nodeProject.npmignore?.include(`/${libdir}/`);

    nodeProject.npmignore?.include(`/${libdir}/**/*.js`);
    nodeProject.npmignore?.include(`/${libdir}/**/*.d.ts`);

    nodeProject.gitignore.exclude("/dist/");
    nodeProject.npmignore?.exclude("dist"); // jsii-pacmak expects this to be "dist" and not "/dist". otherwise it will tamper with it

    nodeProject.npmignore?.exclude("/tsconfig.json");
    nodeProject.npmignore?.exclude("/.github/");
    nodeProject.npmignore?.exclude("/.vscode/");
    nodeProject.npmignore?.exclude("/.idea/");
    nodeProject.npmignore?.exclude("/.projenrc.js");
    nodeProject.npmignore?.exclude("tsconfig.tsbuildinfo");

    // Use tsx to run projen.
    nodeProject.deps.removeDependency("ts-node");
    nodeProject.addDevDeps("tsx");
    nodeProject.defaultTask?.exec("tsx .projenrc.ts");

    nodeProject.addDevDeps("@tsconfig/node18", "@types/node@^18", "typescript");

    nodeProject.addDevDeps("esbuild");
    nodeProject.preCompileTask.exec(`rm -rf ${libdir}`);
    nodeProject.compileTask.reset();
    nodeProject.compileTask.exec(`tsc --declaration --emitDeclarationOnly`);
    nodeProject.compileTask.exec(
      `esbuild $(find src -name '*.ts') --outdir=${libdir} --format=esm --minify --platform=node --sourcemap --target=node18`,
    );
    nodeProject.compileTask.exec(
      `esbuild $(find src -name '*.ts') --outdir=${libdir} --format=cjs --minify --platform=node --sourcemap --target=node18 --out-extension:.js=.cjs`,
    );
    nodeProject.postCompileTask.exec(`rsync -a ${libdir}/* .`);

    nodeProject.addPackageIgnore("*.ts");
    nodeProject.addPackageIgnore("!*.d.ts");
  }
}
