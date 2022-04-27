import { App, StageSynthesisOptions } from "aws-cdk-lib";
import { IConstruct } from "constructs";

const tag = Symbol("cloudy-cdk-lib.AsyncDependencies");

/**
 * Represents a CDK app that may have been tagged with an
 * AsyncDependenciesContext.
 */
interface MaybeTaggedApp extends App {
  [tag]?: AsyncDependenciesContext;
}

/**
 * Manages all of the async dependencies in a CDK application and makes sure
 * that the synth process doesn't start before that.
 *
 * When instantiated, the AsyncDependenciesContext will save itself in the CDK
 * app as a singleton, and will patch the `app.synth()` method, ensuring it
 * can't start before all of the async dependencies are fulfilled.
 */
export class AsyncDependenciesContext {
  /**
   * Holds all of the dependencies promises.
   */
  private readonly promises: Promise<void>[] = [];

  /**
   * Creates a new AsyncDependenciesContext and patches the app so it can't
   * synth before the dependencies are fulfilled.
   * @param app The CDK app.
   */
  private constructor(app: App) {
    Object.assign(app, { [tag]: this });
  }

  /**
   * Returns the AsyncDependenciesContext of the app.
   *
   * @param node The construct node.
   * @returns The AsyncDependenciesContext of the app.
   */
  static of(node: IConstruct) {
    const root = node.node.root;
    if (!(root instanceof App)) {
      throw new TypeError(
        "The root construct must be an instance of [cdk.App].",
      );
    }

    // Return any existing context, or create a new one.
    const app: MaybeTaggedApp = root;
    return app[tag] ?? new AsyncDependenciesContext(app);
  }

  /**
   * Add an async dependency to the app.
   *
   * @param dependency The promise that represents the dependency.
   */
  addAsyncDependency(dependency: Promise<void>) {
    this.promises.push(dependency);
  }

  /**
   * Creates a Promise that is resolved when all of the async dependencies
   * resolve, or rejected when any async dependency fails.
   */
  async waitForAsyncDependencies() {
    await Promise.all(this.promises);
  }
}

/**
 * Waits for all of the async dependencies in the app to resolve.
 * @param app The CDK app.
 */
export async function waitForAsyncDependencies(app: App) {
  const appDependencies = AsyncDependenciesContext.of(app);
  await appDependencies.waitForAsyncDependencies();
}

/**
 * Synthesize this stage into a cloud assembly.
 *
 * Once an assembly has been synthesized, it cannot be modified. Subsequent
 * calls will return the same assembly.
 *
 * Waits for all of the async dependencies to resolve before starting to
 * synthesize.
 *
 * @see {@link App.synth()}
 */
export async function synth(app: App, options?: StageSynthesisOptions) {
  await waitForAsyncDependencies(app);
  return app.synth(options);
}
