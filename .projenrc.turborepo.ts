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
  readonly forAllWorkspaces?: (project: NodeProject) => void;
}

export class Turborepo extends Component {
  public static of(project: Project): Turborepo | undefined {
    const isTurborepo = (c: Component): c is Turborepo =>
      c instanceof Turborepo;
    // eslint-disable-next-line unicorn/no-array-callback-reference
    return project.components.find(isTurborepo);
  }

  private hasInstalledDependencies = false;

  constructor(
    public readonly nodeProject: NodeProject,
    private readonly options?: TurborepoOptions,
  ) {
    super(nodeProject);

    nodeProject.addFields({
      // Required by Yarn v1 Workspaces.
      private: true,
    });
    nodeProject.addDevDeps("turbo");

    const defaultReleaseBranch = nodeProject.release?.branches[0] ?? "main";

    new JsonFile(nodeProject, "turbo.json", {
      obj: {
        $schema: "https://turborepo.org/schema.json",
        baseBranch: options?.baseBranch ?? `origin/${defaultReleaseBranch}`,
        pipeline: options?.pipeline,
      },
      marker: false,
    });

    // Stop using `yarn --check-files`, which doesn't work on Yarn 2/3.
    if (
      this.nodeProject.package.packageManager === NodePackageManager.YARN &&
      !execSync("yarn -v").toString().startsWith("1.")
    ) {
      Object.assign(nodeProject.package, {
        renderInstallCommand(frozen: boolean) {
          return `yarn install ${
            frozen ? "--immutable --immutable-cache" : ""
          }`;
        },
      });
    }
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
    // Ignore turbo files for the root project and its workspaces.
    for (const project of [this.nodeProject, ...this.workspaceProjects]) {
      project.addGitIgnore(".turbo/");
      Eslint.of(project)?.addIgnorePattern(".turbo/");
      Prettier.of(project)?.addIgnorePattern(".turbo/");
    }

    // HACK: Avoid installing dependencies more than once, and also use the
    // root project to do so.
    for (const project of this.workspaceProjects) {
      Object.assign(project.package, {
        installDependencies: () => {
          if (this.hasInstalledDependencies) {
            return;
          }

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this.nodeProject.package.installDependencies();

          this.hasInstalledDependencies = true;
        },
      });
    }

    // Call options.forAllWorkspaces.
    for (const project of this.workspaceProjects) {
      this.options?.forAllWorkspaces?.(project);
    }

    // Create the workspaces entry (either in package.json or in a pnpm-workspace file).
    const workspacesPaths: string[] = this.options?.workspaces ?? [];
    for (const workspaceProject of this.workspaceProjects) {
      const workspace = path.relative(
        this.project.outdir,
        workspaceProject.outdir,
      );
      workspacesPaths.push(workspace);
    }

    const { package: package_ } = this.nodeProject;
    switch (package_.packageManager) {
      case NodePackageManager.PNPM: {
        new YamlFile(this.project, "pnpm-workspace.yaml", {
          obj: {
            packages: workspacesPaths,
          },
        });
        break;
      }

      case NodePackageManager.NPM:
      case NodePackageManager.YARN: {
        package_.addField("workspaces", workspacesPaths);
        break;
      }

      default:
        throw new Error(
          `unexpected package manager ${package_.packageManager}`,
        );
    }
  }
}
