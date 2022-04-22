import { App, StageSynthesisOptions } from "aws-cdk-lib";
import { IConstruct } from "constructs";

const tag = Symbol("@cloudy-ts/cdk.AsyncDependenciesContext");

export class AsyncDependenciesError extends Error {
  constructor(reason: string) {
    super(`Can't run "app.synth()" because: ${reason}`);
  }

  static pendingDependencies() {
    return new AsyncDependenciesError(
      "There are pending dependencies. You must run `await cloudy.waitForAsyncDependencies(app)` before running `app.synth()`.",
    );
  }

  static someDependenciesFailed() {
    return new AsyncDependenciesError("Some dependencies failed.");
  }
}

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
   * Holds the dependencies fulfillment statuses.
   */
  private readonly fulfillmentStatus: ("pending" | "fulfilled" | "failed")[] =
    [];

  /**
   * Creates a new AsyncDependenciesContext and patches the app so it can't
   * synth before the dependencies are fulfilled.
   * @param app The CDK app.
   */
  private constructor(app: App) {
    Object.assign(app, {
      [tag]: this,
      synth: () => {
        if (this.isPending()) {
          throw AsyncDependenciesError.pendingDependencies();
        }

        if (this.hasFailed()) {
          throw AsyncDependenciesError.someDependenciesFailed();
        }

        // Forward the synth call to the app.
        return App.prototype.synth.call(app);
      },
    });
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

    const index = this.fulfillmentStatus.length;
    this.fulfillmentStatus.push("pending");
    dependency.then(
      () => {
        this.fulfillmentStatus[index] = "fulfilled";
      },
      () => {
        this.fulfillmentStatus[index] = "failed";
      },
    );
  }

  /**
   * Creates a Promise that is resolved when all of the async dependencies
   * resolve, or rejected when any async dependency fails.
   */
  async waitForAsyncDependencies() {
    await Promise.all(this.promises);
  }

  /**
   * Returns if there are pending dependencies.
   * @returns True if there are pending dependencies.
   */
  isPending() {
    return this.fulfillmentStatus.includes("pending");
  }

  /**
   * Returns if all of the dependencies are fulfilled.
   * @returns True if all of the dependencies are fulfilled.
   */
  isFulfilled() {
    return this.fulfillmentStatus.every((status) => status === "fulfilled");
  }

  /**
   * Returns if any of the dependencies failed.
   * @returns True if any of the dependencies failed.
   */
  hasFailed() {
    return this.fulfillmentStatus.includes("failed");
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
