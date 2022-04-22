import { App } from "aws-cdk-lib";
import { IConstruct } from "constructs";

const tag = Symbol("@cloudy-ts/cdk.AsyncDependenciesContext");

interface MaybeTaggedApp extends App {
  [tag]?: AsyncDependenciesContext;
}

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
   * Creates a new AsyncDependenciesContext and patches the app so it can't synth before the dependencies are fulfilled.
   * @param app The CDK app.
   */
  private constructor(app: App) {
    Object.assign(app, {
      [tag]: this,
      synth: () => {
        if (this.isPending()) {
          throw new Error(
            "There are pending dependencies. You must run `await cloudy.waitForAsyncDependencies(app)` before running `app.synth()`.",
          );
        }

        if (this.hasFailed()) {
          throw new Error("Some dependencies failed. Can't run `app.synth()`.");
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
   * @returns
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
   * Creates a Promise that is resolved when all of the async dependencies resolve, or rejected when any async dependency fails.
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
 * Waits for all of the async dependencies in the app.
 * @param app The CDK app.
 */
export async function waitForAsyncDependencies(app: App) {
  const appDependencies = AsyncDependenciesContext.of(app);
  await appDependencies.waitForAsyncDependencies();
}
