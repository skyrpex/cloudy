import { execSync } from "node:child_process";
import path from "node:path";

import { Component, JsonFile, Project, YamlFile } from "projen";
import {
  NodePackageManager,
  NodeProject,
  Prettier,
} from "projen/lib/javascript";

import { Eslint } from "./.projenrc.eslint.js";

interface TurborepoOptions {
  readonly baseBranch?: string;
  readonly pipeline?: {
    [name: string]: {
      dependsOn?: string[];
      outputs?: string[];
      cache?: boolean;
    };
  };
  readonly workspaces?: string[];
}

export class Turborepo extends Component {
  public static of(project: Project): Turborepo | undefined {
    const isTurborepo = (c: Component): c is Turborepo =>
      c instanceof Turborepo;
    // eslint-disable-next-line unicorn/no-array-callback-reference
    return project.components.find(isTurborepo);
  }

  constructor(
    public readonly nodeProject: NodeProject,
    private readonly options?: TurborepoOptions,
  ) {
    super(nodeProject);

    this.nodeProject.addFields({
      // Required by Yarn v1 Workspaces.
      private: true,
    });
    this.nodeProject.addGitIgnore(".turbo/");
    this.nodeProject.addDevDeps("turbo");

    const defaultReleaseBranch =
      this.nodeProject.release?.branches[0] ?? "main";

    new JsonFile(nodeProject, "turbo.json", {
      obj: {
        $schema: "https://turborepo.org/schema.json",
        baseBranch: options?.baseBranch ?? `origin/${defaultReleaseBranch}`,
        pipeline: options?.pipeline,
      },
      marker: false,
    });

    Eslint.of(nodeProject)?.addIgnorePattern(".turbo/");
    Prettier.of(nodeProject)?.addIgnorePattern(".turbo/");
  }

  private get subprojects(): Project[] {
    // https://github.com/projen/projen/issues/1433
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const subprojects: Project[] = this.project.subprojects || [];

    return subprojects.sort((a, b) => a.name.localeCompare(b.name));
  }

  private get workspaceProjects(): NodeProject[] {
    return this.subprojects.filter(
      (project): project is NodeProject => project instanceof NodeProject,
    );
  }

  preSynthesize(): void {
    if (this.nodeProject.package.packageManager === NodePackageManager.YARN) {
      // console.log(execSync("yarn -v").toString());
      if (execSync("yarn -v").toString().startsWith("1.")) {
        // Do nothing on Yarn 1.
      } else {
        // Stop using `yarn --check-files`, which doesn't work on Yarn 2/3.
        const workspaces = [
          this.nodeProject,
          //...this.workspaceProjects
        ];
        for (const workspace of workspaces) {
          Object.assign(workspace.package, {
            renderInstallCommand(frozen: boolean) {
              return `yarn install ${
                frozen ? "--immutable --immutable-cache" : ""
              }`;
            },
          });
        }
      }
    }

    for (const workspaceProject of this.workspaceProjects) {
      Eslint.of(workspaceProject)?.addIgnorePattern(".turbo/");
      Prettier.of(workspaceProject)?.addIgnorePattern(".turbo/");
    }

    // Avoid installing dependencies on the subprojects.
    for (const workspaceProject of this.workspaceProjects) {
      Object.assign(workspaceProject.package, {
        installDependencies: () => {},
      });
    }

    const workspaces: string[] = this.options?.workspaces ?? [];
    for (const workspaceProject of this.workspaceProjects) {
      const workspace = path.relative(
        this.project.outdir,
        workspaceProject.outdir,
      );
      workspaces.push(workspace);
    }

    if (workspaces.length > 0) {
      const { package: package_ } = this.nodeProject;
      switch (package_.packageManager) {
        case NodePackageManager.PNPM: {
          new YamlFile(this.project, "pnpm-workspace.yaml", {
            obj: {
              packages: workspaces,
            },
          });
          break;
        }

        case NodePackageManager.NPM:
        case NodePackageManager.YARN: {
          package_.addField("workspaces", workspaces);
          break;
        }

        default:
          throw new Error(
            `unexpected package manager ${package_.packageManager}`,
          );
      }
    }
  }
}
