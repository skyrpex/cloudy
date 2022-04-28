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

    // Use cloudy-node to run projen.
    nodeProject.deps.removeDependency("ts-node");
    nodeProject.addDevDeps("cloudy-node");
    nodeProject.defaultTask?.exec("cloudy-node .projenrc.ts");

    this.nodeProject.addDevDeps(
      "@tsconfig/node14",
      "@types/node@^14",
      "typescript",
    );

    // this.tsconfig = new JsonFile(this.project, "tsconfig.json", {
    //   obj: {
    //     extends: "@tsconfig/node14/tsconfig.json",
    //     compilerOptions: {
    //       module: "ES2022",
    //       moduleResolution: "node",
    //       lib: ["DOM", "ES2020"],
    //       noUncheckedIndexedAccess: true,
    //       useDefineForClassFields: true,
    //       resolveJsonModule: true,
    //       paths: options.tsconfig?.paths,
    //     },
    //     // include: ["**/*.ts", "**/.*.ts"],
    //     // exclude: ["**/node_modules/**"],
    //   },
    // });

    nodeProject.addDevDeps("esbuild");
    nodeProject.preCompileTask.exec(`rm -rf ${libdir}`);
    nodeProject.compileTask.reset();
    nodeProject.compileTask.exec(
      `tsc --declaration --emitDeclarationOnly --outDir ${libdir}`,
    );
    nodeProject.compileTask.exec(
      `esbuild src/*.ts src/**/*.ts --outdir=${libdir}/src --format=esm --minify --platform=node --sourcemap --target=es2020`,
    );
    nodeProject.compileTask.exec(
      `esbuild src/*.ts src/**/*.ts --outdir=${libdir}/src --format=cjs --minify --platform=node --sourcemap --target=node14 --out-extension:.js=.cjs`,
    );
    // nodeProject.postCompileTask.exec(`ls -al`);
    // nodeProject.postCompileTask.exec(`ls -al ${libdir}/src/*`);
    // nodeProject.postCompileTask.exec(`mv ${libdir}/src/* .`);
  }
}
