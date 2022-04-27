import { Component, JsonFile, Project } from "projen";
import { NodeProject, Prettier } from "projen/lib/javascript";
import { Eslint } from "./.projenrc.eslint.js";

import { Tsup } from "./.projenrc.tsup.js";

interface TypeScriptOptions {
  tsconfig?: {
    paths?: { [name: string]: string[] };
  };
}

export class TypeScript extends Component {
  public readonly tsconfig: JsonFile;

  public static of(project: Project): TypeScript | undefined {
    const isTypeScript = (c: Component): c is TypeScript =>
      c instanceof TypeScript;
    // eslint-disable-next-line unicorn/no-array-callback-reference
    return project.components.find(isTypeScript);
  }

  constructor(
    public readonly nodeProject: NodeProject,
    options?: TypeScriptOptions,
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
    nodeProject.addDevDeps("cloudy-node");
    nodeProject.defaultTask?.exec("cloudy-node .projenrc.ts");

    this.nodeProject.addDevDeps(
      "@tsconfig/node14",
      "@types/node@^14",
      "typescript",
    );

    this.tsconfig = new JsonFile(this.project, "tsconfig.json", {
      obj: {
        extends: "@tsconfig/node14/tsconfig.json",
        compilerOptions: {
          module: "ES2022",
          moduleResolution: "node",
          lib: ["DOM", "ES2020"],
          noUncheckedIndexedAccess: true,
          useDefineForClassFields: true,
          resolveJsonModule: true,
          paths: options?.tsconfig?.paths,
        },
        // include: ["**/*.ts", "**/.*.ts"],
        // exclude: ["**/node_modules/**"],
      },
    });

    new Tsup(nodeProject, {
      libdir,
      entries: ["src/index.ts"],
    });

    Eslint.of(nodeProject)?.addIgnorePattern(`${libdir}/`);
    Prettier.of(nodeProject)?.addIgnorePattern(`${libdir}/`);
  }
}
