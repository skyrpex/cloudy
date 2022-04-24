import { Component, IgnoreFile, JsonFile, Project } from "projen";
import { NodeProject, Prettier } from "projen/lib/javascript";

export interface EslintOptions {
  devFiles?: string[];

  pathGroups?: {
    pattern: string;
    group: "external";
    position: "after";
  }[];
  // /**
  //  * Path to `tsconfig.json` which should be used by eslint.
  //  * @default "./tsconfig.json"
  //  */
  // readonly tsconfigPath?: string;

  // /**
  //  * Directories with source files to lint (e.g. [ "src" ])
  //  */
  // readonly dirs: string[];

  // /**
  //  * Directories with source files that include tests and build tools. These
  //  * sources are linted but may also import packages from `devDependencies`.
  //  * @default []
  //  */
  // readonly devdirs?: string[];

  // /**
  //  * File types that should be linted (e.g. [ ".js", ".ts" ])
  //  * @default [".ts"]
  //  */
  // readonly fileExtensions?: string[];

  // /**
  //  * List of file patterns that should not be linted, using the same syntax
  //  * as .gitignore patterns.
  //  *
  //  * @default [ '*.js', '*.d.ts', 'node_modules/', '*.generated.ts', 'coverage' ]
  //  */
  // readonly ignorePatterns?: string[];

  // /**
  //  * Should we lint .projenrc.js
  //  * @default true
  //  */
  // readonly lintProjenRc?: boolean;

  /**
   * Enable prettier for code formatting
   * @default false
   */
  readonly prettier?: boolean;

  // /**
  //  * Enable import alias for module paths
  //  * @default undefined
  //  */
  // readonly aliasMap?: { [key: string]: string };

  // /**
  //  * Enable import alias for module paths
  //  * @default undefined
  //  */
  // readonly aliasExtensions?: string[];

  /**
   * Always try to resolve types under `<root>@types` directory even it doesn't contain any source code.
   * This prevents `import/no-unresolved` eslint errors when importing a `@types/*` module that would otherwise remain unresolved.
   * @default true
   */
  readonly tsAlwaysTryTypes?: boolean;
}

/**
 * eslint rules override
 */
export interface EslintOverride {
  /**
   * Files or file patterns on which to apply the override
   */
  readonly files: string[];

  /**
   * The overriden rules
   */
  readonly rules: { [rule: string]: any };
}

export class Eslint extends Component {
  /**
   * Returns the singletone Eslint component of a project or undefined if there is none.
   */
  public static of(project: Project): Eslint | undefined {
    const isEslint = (c: Component): c is Eslint => c instanceof Eslint;
    // eslint-disable-next-line unicorn/no-array-callback-reference
    return project.components.find(isEslint);
  }

  /**
   * eslint rules.
   */
  public readonly rules: { [rule: string]: any[] };

  /**
   * eslint overrides.
   */
  public readonly overrides: EslintOverride[] = [];

  /**
   * Direct access to the eslint configuration (escape hatch)
   */
  public readonly config: any;

  /**
   * File patterns that should not be linted
   */
  // public readonly ignorePatterns: string[]

  private _formattingRules: Record<string, any>;
  // private readonly _allowDevDeps: Set<string>
  private readonly _plugins = new Array<string>();
  private readonly _extends = new Array<string>();

  private readonly nodeProject: NodeProject;

  public readonly ignoreFile: IgnoreFile;

  constructor(project: NodeProject, options?: EslintOptions) {
    super(project);

    this.nodeProject = project;
    this.ignoreFile = new IgnoreFile(project, ".eslintignore");
    this.addIgnorePattern("!.*.ts");
    this.addIgnorePattern("node_modules/");

    project.addTask("lint", {
      exec: "eslint --ext ts .",
    });

    project.addTask("lint:fix", {
      exec: "eslint --ext ts . --fix",
    });

    if (options.prettier) {
      project.addTask("format", {
        exec: "prettier --check '**/*.ts'",
      });

      project.addTask("format:fix", {
        exec: "prettier --write '**/*.ts'",
      });
    }

    project.addDevDeps(
      "eslint",
      "typescript",
      "@typescript-eslint/eslint-plugin",
      "@typescript-eslint/parser",
      "eslint-import-resolver-node",
      "eslint-import-resolver-typescript",
      "eslint-plugin-import",
      "eslint-plugin-unicorn",
      "@cloudy-ts/eslint-plugin",
    );

    this.addExtends(
      "plugin:unicorn/recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript",
      "plugin:@cloudy-ts/recommended",
    );

    // exclude some files
    project.npmignore?.exclude("/.eslintrc.json");

    this._formattingRules = {};
    this.rules = {
      "@typescript-eslint/no-empty-interface": ["off"],
      "@typescript-eslint/no-empty-function": ["off"],
      "@typescript-eslint/ban-types": ["off"],
      "import/order": [
        "warn",
        {
          "newlines-between": "always",
          pathGroups: options?.pathGroups ?? [],
          pathGroupsExcludedImportTypes: ["builtin"],
          groups: ["builtin", "external"],
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/no-extraneous-dependencies": [
        "error",
        { devDependencies: options?.devFiles ?? undefined },
      ],
      "unicorn/prevent-abbreviations": [
        "error",
        {
          replacements: {
            props: false,
          },
        },
      ],
    };

    new JsonFile(project, ".eslintrc.json", {
      obj: {
        root: true,
        env: {
          es2021: true,
          node: true,
        },
        parser: "@typescript-eslint/parser",
        parserOptions: {
          sourceType: "module",
          ecmaVersion: 2020,
        },
        extends: () => this._extends,
        plugins: () => this._plugins,
        settings: {
          "import/parsers": {
            "@typescript-eslint/parser": [".ts"],
          },
          "import/resolver": {
            typescript: {
              alwaysTryTypes: true,
            },
          },
        },
        rules: () => ({ ...this._formattingRules, ...this.rules }),
      },
      marker: false,
    });

    if (Prettier.of(project)) {
      this.enablePrettier();
    }
  }

  /**
   * Add an eslint rule.
   */
  public addRules(rules: { [rule: string]: any }) {
    for (const [k, v] of Object.entries(rules)) {
      this.rules[k] = v;
    }
  }

  /**
   * Adds an eslint plugin
   * @param plugins The names of plugins to add
   */
  public addPlugins(...plugins: string[]) {
    this._plugins.push(...plugins);
  }

  /**
   * Add an eslint override.
   */
  public addOverride(override: EslintOverride) {
    this.overrides.push(override);
  }

  /**
   * Do not lint these files.
   */
  public addIgnorePattern(pattern: string) {
    this.ignoreFile.addPatterns(pattern);
  }

  /**
   * Adds an `extends` item to the eslint configuration.
   * @param extendList The list of "extends" to add.
   */
  public addExtends(...extendList: string[]) {
    this._extends.push(...extendList);
  }

  /**
   * Enables prettier for code formatting.
   */
  private enablePrettier() {
    this.nodeProject.addDevDeps(
      "prettier",
      "eslint-plugin-prettier",
      "eslint-config-prettier",
    );

    this.addPlugins("prettier");

    this._formattingRules = {
      "prettier/prettier": ["error"],
    };

    this.addExtends("prettier", "plugin:prettier/recommended");
  }
}
