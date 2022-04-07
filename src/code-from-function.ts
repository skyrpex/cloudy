import * as cdk from "aws-cdk-lib"
import { runtime } from "@pulumi/pulumi"

import { EsbuildBundling } from "./esbuild-bundling"
import { Construct } from "constructs"

export async function codeFromFunction(function_: (...any: any[]) => any) {
  const tokens: {
    // construct: cdk.Resource
    construct: Construct
    attribute: string
    cfnToken: string
    hash: string
    // hash2: string
  }[] = []
  const serializationContext = {
    // construct: undefined as cdk.Resource | undefined,
    construct: undefined as Construct | undefined,
    attribute: undefined as string | undefined,
    cfnToken: undefined as string | undefined,
  }
  const result = await runtime.serializeFunction(function_, {
    serialize(item) {
      // console.log({
      //   instanceOfResource: item instanceof cdk.Resource,
      //   isConstruct: Construct.isConstruct(item),
      //   isResource:
      //     Construct.isConstruct(item) && cdk.Resource.isResource(item),
      // })
      // if (item && Construct.isConstruct(item) && cdk.Resource.isResource(item)) {
      if (item && Construct.isConstruct(item)) {
        serializationContext.construct = item
      } else if (
        serializationContext.construct &&
        !serializationContext.attribute &&
        typeof item === "string"
      ) {
        serializationContext.attribute = item
      } else if (
        serializationContext.construct &&
        serializationContext.attribute &&
        typeof item === "string" &&
        /^\${Token\[TOKEN\.(\d+)]}$/.test(item)
      ) {
        serializationContext.cfnToken = item
        const { construct, attribute, cfnToken } = serializationContext
        if (construct && attribute && cfnToken) {
          // console.log({ attribute, cfnToken })
          tokens.push({
            construct,
            attribute,
            cfnToken,
            // hash: `${cdk.Names.uniqueId(construct)}${attribute}_${
            //   tokens.length
            // }`,
            hash: `${cdk.Names.uniqueId(construct)}${attribute}`,
          })
        }
        serializationContext.attribute = undefined
        serializationContext.cfnToken = undefined
      }
      return true
    },
  })

  let sourceCode = result.text

  for (const token of tokens) {
    sourceCode = sourceCode.replace(
      `"${token.cfnToken}"`,
      `process.env["${token.hash}"]`,
    )
  }

  const code = EsbuildBundling.bundle({
    stdin: {
      contents: sourceCode,
      resolveDir: process.cwd(),
    },
    // define
    // external
  })

  return {
    code,
    tokens,
  }
}
