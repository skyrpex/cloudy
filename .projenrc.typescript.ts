import { Component, JsonFile, Project } from "projen";
import { NodeProject } from "projen/lib/javascript";

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
  }
}
