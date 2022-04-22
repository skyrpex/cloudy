import { App } from "aws-cdk-lib";
import {
  CfnFunction,
  Code,
  Function as BaseFunction,
  FunctionProps,
  Runtime,
  verifyCodeConfig,
} from "aws-cdk-lib/aws-lambda";
import { Construct, IConstruct } from "constructs";

export interface FunctionProperties extends Omit<FunctionProps, "code"> {
  /**
   * The source code of your Lambda function. You can point to a file in an
   * Amazon Simple Storage Service (Amazon S3) bucket or specify your source
   * code as inline text.
   */
  code: Code | Promise<Code>;
}

const tag = Symbol("@cloudy-ts/cdk.AsyncDependenciesContext");

interface MaybeTaggedApp extends App {
  [tag]?: AsyncDependenciesContext;
}

class AsyncDependenciesContext {
  private readonly promises: Promise<any>[] = [];

  private readonly fulfillmentStatus: ("pending" | "fulfilled" | "failed")[] =
    [];

  private constructor(app: App) {
    // if ((app as any)[tag]) {
    //   throw new Error(
    //     `The app has already been tagged with [${tag.toString()}]`,
    //   );
    // }

    Object.assign(app, {
      [tag]: this,
      synth: () => {
        if (this.isPending()) {
          throw new Error(
            "There are pending dependencies. You must run `await cloudy.aws_lambda.Function.waitForCodePromises(app)` before running `app.synth()`.",
          );
        }

        if (this.hasFailed()) {
          throw new Error("Some dependencies failed. Can't synthetize.");
        }

        // Forward the synth call to the app.
        return App.prototype.synth.call(app);
      },
    });
  }

  static of(root: IConstruct) {
    if (!(root instanceof App)) {
      throw new TypeError(
        "The root construct must be an instance of [cdk.App]",
      );
    }

    const app: MaybeTaggedApp = root;
    return app[tag] ?? new AsyncDependenciesContext(app);
  }

  addAsyncDependency(promise: Promise<any>) {
    this.promises.push(promise);

    const index = this.fulfillmentStatus.length;
    this.fulfillmentStatus.push("pending");
    promise.then(
      () => {
        this.fulfillmentStatus[index] = "fulfilled";
      },
      () => {
        this.fulfillmentStatus[index] = "failed";
      },
    );
  }

  async waitForAsyncDependencies() {
    await Promise.all(this.promises);
  }

  isPending() {
    return this.fulfillmentStatus.includes("pending");
  }

  isFulfilled() {
    return this.fulfillmentStatus.every((status) => status === "pending");
  }

  hasFailed() {
    return this.fulfillmentStatus.includes("failed");
  }
}

// interface AppContext {
//   // All the promises that must be resolved before the synth process begins.
//   promises: Promise<any>[];
//   // The state of the promises.
//   asyncDependencies: boolean[];
// }

// interface TaggedApp extends App {
//   [tag]?: AppContext;
// }

// /**
//  * Gets or creates a new app context for the given root construct.
//  * @param root The root of the CDK constructs.
//  * @returns The app context.
//  */
// function getAppContext(root: IConstruct): AppContext {
//   if (!(root instanceof App)) {
//     throw new TypeError("The root construct must be an instance of [cdk.App]");
//   }

//   const app: TaggedApp = root;

//   // Return early if the app context exists.
//   let appContext = app[tag];
//   if (appContext) {
//     return appContext;
//   }

//   // Create a new app context, assign it and patch the app.synth() method.
//   appContext = {
//     asyncDependencies: [],
//     promises: [],
//   };
//   Object.assign(app, {
//     [tag]: appContext,
//     synth() {
//       // Throw an error if there's unresolved async dependencies.
//       if (appContext?.asyncDependencies.includes(false)) {
//         throw new Error(
//           "You must run `await cloudy.aws_lambda.Function.waitForCodePromises(app)` before running `app.synth()`.",
//         );
//       }

//       // Forward the synth call to the app.
//       return App.prototype.synth.call(app);
//     },
//   });
//   return appContext;
// }

/**
 * Deploys a file from inside the construct library as a function.
 *
 * The supplied file is subject to the 4096 bytes limit of being embedded in a
 * CloudFormation template.
 *
 * The construct includes an associated role with the lambda.
 *
 * This construct does not yet reproduce all features from the underlying resource
 * library.
 */
export class Function extends BaseFunction {
  constructor(scope: Construct, id: string, properties: FunctionProperties) {
    super(scope, id, {
      ...properties,
      // TODO: Find a Code that crashes when trying to synthesize... Maybe a
      // docker image that throws or doesn't exist, or an impossible S3 asset.
      // The problem right now is that whatever we pass to the constructor gets
      // processed. Maybe there's a method or property that only gets called on
      // the synthesizing process.
      // code: Code.fromInline("export function handler() {}"),
      // code: Code.fromInline("throw new Error()"),
      code: Code.fromInline(" "),
      handler: "index.handler",
      runtime: Runtime.NODEJS_14_X,
    });

    // // Get our private context.
    // const appContext = getAppContext(scope.node.root);
    // const dependencyIndex = appContext.asyncDependencies.length;
    // appContext.asyncDependencies.push(false);
    const appDependencies = AsyncDependenciesContext.of(scope.node.root);

    const resource = this.node.children.find(
      (children): children is CfnFunction => children instanceof CfnFunction,
    );
    if (!resource) {
      throw new Error("Resource [CfnFunction] not found");
    }

    const promise = Promise.resolve(properties.code).then((code) => {
      const codeConfig = code.bind(this);
      verifyCodeConfig(codeConfig, {
        ...properties,
        code,
      });

      resource.code = {
        s3Bucket: codeConfig.s3Location?.bucketName,
        s3Key: codeConfig.s3Location?.objectKey,
        s3ObjectVersion: codeConfig.s3Location?.objectVersion,
        zipFile: codeConfig.inlineCode,
        imageUri: codeConfig.image?.imageUri,
      };
      code.bindToResource(resource);

      // // Resolve our async dependency.
      // appContext.asyncDependencies[dependencyIndex] = true;
    });
    // appContext.promises.push(promise);
    appDependencies.addAsyncDependency(promise);
  }

  static async waitForCodePromises(app: App) {
    // const appContext = getAppContext(app);
    // await Promise.all(appContext.promises);
    const appDependencies = AsyncDependenciesContext.of(app);
    await appDependencies.waitForAsyncDependencies();
  }
}
