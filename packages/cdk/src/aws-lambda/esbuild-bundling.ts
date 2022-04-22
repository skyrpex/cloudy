import path from "node:path";

import * as cdk from "aws-cdk-lib";
import { AssetCode, Code } from "aws-cdk-lib/aws-lambda";
import * as esbuild from "esbuild";
import { findUpSync } from "find-up";

const findDepsLockFilePath = (input: string) => {
  const lockFilePath = findUpSync(
    ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"],
    {
      cwd: input,
    },
  );

  if (!lockFilePath) {
    throw new Error(
      "Couldn't find a lock file (package-lock.json or yarn.lock)",
    );
  }

  return lockFilePath;
};

// /**
//  * Converts a Lambda runtime to an esbuild node target.
//  */
// function toTarget(runtime: Runtime): string {
//   const match = runtime.name.match(/nodejs(\d+)/)

//   if (!match) throw new Error("Cannot extract version from runtime.")

//   return `node${match[1]}`
// }

export interface EsbuildBundlingProps {
  // input: string
  // stdin: esbuild.StdinOptions
  stdin: {
    contents: string;
    resolveDir: string;
  };
  // runtime: Runtime
  external?: string[];
  define?: {
    [key: string]: string;
  };
}

export class EsbuildBundling {
  public static bundle(options: EsbuildBundlingProps): AssetCode {
    // const depsLockFilePath = findDepsLockFilePath(options.input)
    const depsLockFilePath = findDepsLockFilePath(options.stdin.resolveDir);
    // console.log({ depsLockFilePath })

    return Code.fromAsset(path.dirname(depsLockFilePath), {
      assetHashType: cdk.AssetHashType.OUTPUT,
      bundling: new EsbuildBundling(options),
    });
  }

  public readonly image: cdk.DockerImage;

  public readonly local: cdk.ILocalBundling;

  constructor(private readonly properties: EsbuildBundlingProps) {
    this.image = cdk.DockerImage.fromRegistry("dummy");
    this.local = {
      tryBundle(outputDirectory) {
        // console.log({ outputDir: outputDirectory, input: properties.input })
        esbuild.buildSync({
          // entryPoints: [properties.input],
          stdin: properties.stdin,
          bundle: true,
          platform: "node",
          // target: toTarget(properties.runtime),
          target: "node14.14",
          outfile: `${outputDirectory}/index.js`,
          external: ["aws-sdk", ...(properties.external || [])],
          define: properties.define,
          // minify: true,
        });
        return true;
      },
    };
  }
}
