import * as crypto from "node:crypto";

import { CfnResource, FeatureFlags, Stack } from "aws-cdk-lib";
import { LAMBDA_RECOGNIZE_VERSION_PROPS } from "aws-cdk-lib/cx-api";

import { CallbackFunction as LambdaFunction } from "./callback-function.js";

export function calculateFunctionHash(function_: LambdaFunction<any, any>) {
  const stack = Stack.of(function_);

  const functionResource = function_.node.defaultChild as CfnResource;

  // render the cloudformation resource from this function
  const config = stack.resolve((functionResource as any)._toCloudFormation());
  // config is of the shape: { Resources: { LogicalId: { Type: 'Function', Properties: { ... } }}}
  const resources = config.Resources;
  const resourceKeys = Object.keys(resources);
  if (resourceKeys.length !== 1) {
    throw new Error(
      `Expected one rendered CloudFormation resource but found ${resourceKeys.length}`,
    );
  }
  const logicalId = resourceKeys[0];
  if (!logicalId) {
    throw new Error(`Expected resourceKey[0] to have a value`);
  }
  const properties = resources[logicalId].Properties;

  let stringifiedConfig;
  if (FeatureFlags.of(function_).isEnabled(LAMBDA_RECOGNIZE_VERSION_PROPS)) {
    const updatedProperties = sortProperties(filterUsefulKeys(properties));
    stringifiedConfig = JSON.stringify(updatedProperties);
  } else {
    const sorted = sortProperties(properties);
    config.Resources[logicalId].Properties = sorted;
    stringifiedConfig = JSON.stringify(config);
  }

  const hash = crypto.createHash("md5");
  hash.update(stringifiedConfig);
  return hash.digest("hex");
}

export function trimFromStart(s: string, maxLength: number) {
  const desiredLength = Math.min(maxLength, s.length);
  const newStart = s.length - desiredLength;
  return s.slice(Math.max(0, newStart));
}

/*
 * The list of properties found in CfnFunction (or AWS::Lambda::Function).
 * They are classified as "locked" to a Function Version or not.
 * When a property is locked, any change to that property will not take effect on previously created Versions.
 * Instead, a new Version must be generated for the change to take effect.
 * Similarly, if a property that's not locked to a Version is modified, a new Version
 * must not be generated.
 *
 * Adding a new property to this list - If the property is part of the UpdateFunctionConfiguration
 * API or UpdateFunctionCode API, then it must be classified as true, otherwise false.
 * See https://docs.aws.amazon.com/lambda/latest/dg/API_UpdateFunctionConfiguration.html and
 * https://docs.aws.amazon.com/lambda/latest/dg/API_UpdateFunctionConfiguration.html
 */
export const VERSION_LOCKED: { [key: string]: boolean } = {
  // locked to the version
  Architectures: true,
  Code: true,
  DeadLetterConfig: true,
  Description: true,
  Environment: true,
  FileSystemConfigs: true,
  FunctionName: true,
  Handler: true,
  ImageConfig: true,
  KmsKeyArn: true,
  Layers: true,
  MemorySize: true,
  PackageType: true,
  Role: true,
  Runtime: true,
  Timeout: true,
  TracingConfig: true,
  VpcConfig: true,

  // not locked to the version
  CodeSigningConfigArn: false,
  ReservedConcurrentExecutions: false,
  Tags: false,
};

function filterUsefulKeys(properties: any) {
  const versionProperties = { ...VERSION_LOCKED, ...LambdaFunction._VER_PROPS };
  const unclassified = Object.entries(properties)
    .filter(
      ([k, v]) => v != undefined && !Object.keys(versionProperties).includes(k),
    )
    .map(([k, _]) => k);
  if (unclassified.length > 0) {
    throw new Error(
      `The following properties are not recognized as version properties: [${unclassified}].` +
        " See the README of the aws-lambda module to learn more about this and to fix it.",
    );
  }
  const notLocked = Object.entries(versionProperties)
    .filter(([_, v]) => !v)
    .map(([k, _]) => k);
  for (const p of notLocked) delete properties[p];

  const returnValue: { [key: string]: any } = {};
  for (const [k, v] of Object.entries(properties).filter(
    ([k, _]) => versionProperties[k],
  ))
    returnValue[k] = v;
  return returnValue;
}

function sortProperties(properties: any) {
  const returnValue: any = {};
  // We take all required properties in the order that they were historically,
  // to make sure the hash we calculate is stable.
  // There cannot be more required properties added in the future,
  // as that would be a backwards-incompatible change.
  const requiredProperties = ["Code", "Handler", "Role", "Runtime"];
  for (const requiredProperty of requiredProperties) {
    returnValue[requiredProperty] = properties[requiredProperty];
  }
  // then, add all of the non-required properties,
  // in the original order
  for (const property of Object.keys(properties)) {
    if (!requiredProperties.includes(property)) {
      returnValue[property] = properties[property];
    }
  }
  return returnValue;
}
