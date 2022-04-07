import * as cdk from "aws-cdk-lib"
import {
  ArnFormat,
  CfnResource,
  Duration,
  Lazy,
  Names,
  Stack,
  Token,
} from "aws-cdk-lib"
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch"
import {
  ComputePlatform,
  ProfilingGroup,
} from "aws-cdk-lib/aws-codeguruprofiler"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as iam from "aws-cdk-lib/aws-iam"
import {
  Architecture,
  AssetCode,
  CfnFunction,
  Code,
  EnvironmentOptions,
  EventInvokeConfigOptions,
  ILayerVersion,
  Runtime,
  Tracing,
  verifyCodeConfig,
  Version,
  VersionOptions,
} from "aws-cdk-lib/aws-lambda"
import * as logs from "aws-cdk-lib/aws-logs"
import * as sns from "aws-cdk-lib/aws-sns"
import * as sqs from "aws-cdk-lib/aws-sqs"
import { Construct } from "constructs"
import { codeFromFunction } from "./code-from-function"

import { calculateFunctionHash, trimFromStart } from "./function-hash"

export interface FunctionProperties<InputType, OutputType>
  extends Omit<cdk.aws_lambda.FunctionProps, "code" | "handler" | "runtime"> {
  handler: (input: InputType) => Promise<OutputType>
}

// export class Function<InputType = any, OutputType = any> extends cdk.aws_lambda
export class Function<InputType, OutputType> extends cdk.aws_lambda
  .FunctionBase {
  /**
   * Returns a `lambda.Version` which represents the current version of this
   * Lambda function. A new version will be created every time the function's
   * configuration changes.
   *
   * You can specify options for this version using the `currentVersionOptions`
   * prop when initializing the `lambda.Function`.
   */
  public get currentVersion(): cdk.aws_lambda.Version {
    if (this._currentVersion) {
      return this._currentVersion
    }

    this._currentVersion = new cdk.aws_lambda.Version(this, "CurrentVersion", {
      lambda: this,
      ...this.currentVersionOptions,
    })

    // override the version's logical ID with a lazy string which includes the
    // hash of the function itself, so a new version resource is created when
    // the function configuration changes.
    const cfn = this._currentVersion.node.defaultChild as cdk.CfnResource
    const originalLogicalId = this.stack.resolve(cfn.logicalId) as string

    cfn.overrideLogicalId(
      cdk.Lazy.uncachedString({
        produce: () => {
          const hash = calculateFunctionHash(this)
          const logicalId = trimFromStart(originalLogicalId, 255 - 32)
          return `${logicalId}${hash}`
        },
      }),
    )

    return this._currentVersion
  }

  public get resourceArnsForGrantInvoke() {
    return [this.functionArn, `${this.functionArn}:*`]
  }

  /** @internal */
  public static _VER_PROPS: { [key: string]: boolean } = {}

  /**
   * Record whether specific properties in the `AWS::Lambda::Function` resource should
   * also be associated to the Version resource.
   * See 'currentVersion' section in the module README for more details.
   * @param propertyName The property to classify
   * @param locked whether the property should be associated to the version or not.
   */
  public static classifyVersionProperty(propertyName: string, locked: boolean) {
    this._VER_PROPS[propertyName] = locked
  }

  /**
   * Return the given named metric for this Lambda
   */
  public static metricAll(
    metricName: string,
    properties?: cloudwatch.MetricOptions,
  ): cloudwatch.Metric {
    return new cloudwatch.Metric({
      namespace: "AWS/Lambda",
      metricName,
      ...properties,
    })
  }
  /**
   * Metric for the number of Errors executing all Lambdas
   *
   * @default sum over 5 minutes
   */
  public static metricAllErrors(
    properties?: cloudwatch.MetricOptions,
  ): cloudwatch.Metric {
    return this.metricAll("Errors", { statistic: "sum", ...properties })
  }

  /**
   * Metric for the Duration executing all Lambdas
   *
   * @default average over 5 minutes
   */
  public static metricAllDuration(
    properties?: cloudwatch.MetricOptions,
  ): cloudwatch.Metric {
    return this.metricAll("Duration", properties)
  }

  /**
   * Metric for the number of invocations of all Lambdas
   *
   * @default sum over 5 minutes
   */
  public static metricAllInvocations(
    properties?: cloudwatch.MetricOptions,
  ): cloudwatch.Metric {
    return this.metricAll("Invocations", { statistic: "sum", ...properties })
  }

  /**
   * Metric for the number of throttled invocations of all Lambdas
   *
   * @default sum over 5 minutes
   */
  public static metricAllThrottles(
    properties?: cloudwatch.MetricOptions,
  ): cloudwatch.Metric {
    return this.metricAll("Throttles", { statistic: "sum", ...properties })
  }

  /**
   * Metric for the number of concurrent executions across all Lambdas
   *
   * @default max over 5 minutes
   */
  public static metricAllConcurrentExecutions(
    properties?: cloudwatch.MetricOptions,
  ): cloudwatch.Metric {
    // Mini-FAQ: why max? This metric is a gauge that is emitted every
    // minute, so either max or avg or a percentile make sense (but sum
    // doesn't). Max is more sensitive to spiky load changes which is
    // probably what you're interested in if you're looking at this metric
    // (Load spikes may lead to concurrent execution errors that would
    // otherwise not be visible in the avg)
    return this.metricAll("ConcurrentExecutions", {
      statistic: "max",
      ...properties,
    })
  }

  /**
   * Metric for the number of unreserved concurrent executions across all Lambdas
   *
   * @default max over 5 minutes
   */
  public static metricAllUnreservedConcurrentExecutions(
    properties?: cloudwatch.MetricOptions,
  ): cloudwatch.Metric {
    return this.metricAll("UnreservedConcurrentExecutions", {
      statistic: "max",
      ...properties,
    })
  }

  /**
   * Name of this function
   */
  public readonly functionName: string

  /**
   * ARN of this function
   */
  public readonly functionArn: string

  /**
   * Execution role associated with this function
   */
  public readonly role: iam.IRole

  /**
   * The runtime configured for this lambda.
   */
  public readonly runtime: Runtime = Runtime.NODEJS_14_X

  /**
   * The principal this Lambda Function is running as
   */
  public readonly grantPrincipal: iam.IPrincipal

  /**
   * The DLQ (as queue) associated with this Lambda Function (this is an optional attribute).
   */
  public readonly deadLetterQueue?: sqs.IQueue

  /**
   * The DLQ (as topic) associated with this Lambda Function (this is an optional attribute).
   */
  public readonly deadLetterTopic?: sns.ITopic

  /**
   * The architecture of this Lambda Function (this is an optional attribute and defaults to X86_64).
   */
  public readonly architecture: Architecture

  /**
   * The timeout configured for this lambda.
   */
  public readonly timeout?: Duration

  public readonly permissionsNode = this.node

  protected readonly canCreatePermissions = true

  private readonly layers: ILayerVersion[] = []

  private _logGroup?: logs.ILogGroup

  /**
   * Environment variables for this function
   */
  private environment: { [key: string]: EnvironmentConfig } = {}

  private readonly currentVersionOptions?: VersionOptions
  private _currentVersion?: Version

  private _architecture?: Architecture

  constructor(
    scope: Construct,
    id: string,
    properties: FunctionProperties<InputType, OutputType>,
  ) {
    super(scope, id, {
      physicalName: properties.functionName,
    })

    if (
      properties.functionName &&
      !Token.isUnresolved(properties.functionName)
    ) {
      if (properties.functionName.length > 64) {
        throw new Error(
          `Function name can not be longer than 64 characters but has ${properties.functionName.length} characters.`,
        )
      }
      if (!/^[\w-]+$/.test(properties.functionName)) {
        throw new Error(
          `Function name ${properties.functionName} can contain only letters, numbers, hyphens, or underscores with no spaces.`,
        )
      }
    }

    const managedPolicies = new Array<iam.IManagedPolicy>()

    // the arn is in the form of - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    managedPolicies.push(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole",
      ),
    )

    if (properties.vpc) {
      // Policy that will have ENI creation permissions
      managedPolicies.push(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaVPCAccessExecutionRole",
        ),
      )
    }

    this.role =
      properties.role ||
      new iam.Role(this, "ServiceRole", {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies,
      })
    this.grantPrincipal = this.role

    // add additional managed policies when necessary
    if (properties.filesystem) {
      const config = properties.filesystem.config
      if (config.policies) {
        for (const p of config.policies) {
          this.role?.addToPrincipalPolicy(p)
        }
      }
    }

    for (const statement of properties.initialPolicy || []) {
      this.role.addToPrincipalPolicy(statement)
    }

    // const code = properties.code.bind(this)
    // verifyCodeConfig(code, properties)

    let profilingGroupEnvironmentVariables: { [key: string]: string } = {}
    if (properties.profilingGroup && properties.profiling !== false) {
      this.validateProfiling(properties)
      properties.profilingGroup.grantPublish(this.role)
      profilingGroupEnvironmentVariables = {
        AWS_CODEGURU_PROFILER_GROUP_ARN: Stack.of(scope).formatArn({
          service: "codeguru-profiler",
          resource: "profilingGroup",
          resourceName: properties.profilingGroup.profilingGroupName,
        }),
        AWS_CODEGURU_PROFILER_ENABLED: "TRUE",
      }
    } else if (properties.profiling) {
      this.validateProfiling(properties)
      const profilingGroup = new ProfilingGroup(this, "ProfilingGroup", {
        computePlatform: ComputePlatform.AWS_LAMBDA,
      })
      profilingGroup.grantPublish(this.role)
      profilingGroupEnvironmentVariables = {
        AWS_CODEGURU_PROFILER_GROUP_ARN: profilingGroup.profilingGroupArn,
        AWS_CODEGURU_PROFILER_ENABLED: "TRUE",
      }
    }

    const environment = {
      ...profilingGroupEnvironmentVariables,
      ...properties.environment,
    }
    for (const [key, value] of Object.entries(environment)) {
      this.addEnvironment(key, value as string)
    }

    // DLQ can be either sns.ITopic or sqs.IQueue
    const dlqTopicOrQueue = this.buildDeadLetterQueue(properties)
    if (dlqTopicOrQueue !== undefined) {
      if (this.isQueue(dlqTopicOrQueue)) {
        this.deadLetterQueue = dlqTopicOrQueue
      } else {
        this.deadLetterTopic = dlqTopicOrQueue
      }
    }

    let fileSystemConfigs: CfnFunction.FileSystemConfigProperty[] | undefined
    if (properties.filesystem) {
      fileSystemConfigs = [
        {
          arn: properties.filesystem.config.arn,
          localMountPath: properties.filesystem.config.localMountPath,
        },
      ]
    }

    // if (properties.architecture && properties.architectures !== undefined) {
    //   throw new Error(
    //     "Either architecture or architectures must be specified but not both.",
    //   )
    // }
    // if (properties.architectures && properties.architectures.length > 1) {
    //   throw new Error("Only one architecture must be specified.")
    // }
    // this._architecture =
    //   properties.architecture ??
    //   (properties.architectures && properties.architectures[0])

    const resource = new CfnFunction(this, "Resource", {
      functionName: this.physicalName,
      description: properties.description,
      // code: {
      //   s3Bucket: code.s3Location && code.s3Location.bucketName,
      //   s3Key: code.s3Location && code.s3Location.objectKey,
      //   s3ObjectVersion: code.s3Location && code.s3Location.objectVersion,
      //   zipFile: code.inlineCode,
      //   imageUri: code.image?.imageUri,
      // },
      code: {}, // Evaluated later
      layers: Lazy.list(
        { produce: () => this.layers.map((layer) => layer.layerVersionArn) },
        { omitEmpty: true },
      ), // Evaluated on synthesis
      // handler:
      //   properties.handler === Handler.FROM_IMAGE
      //     ? undefined
      //     : properties.handler,
      handler: "index.handler",
      timeout: properties.timeout && properties.timeout.toSeconds(),
      // packageType:
      //   properties.runtime === Runtime.FROM_IMAGE ? "Image" : undefined,
      packageType: undefined,
      // runtime:
      //   properties.runtime === Runtime.FROM_IMAGE
      //     ? undefined
      //     : properties.runtime.name,
      runtime: Runtime.NODEJS_14_X.name,
      role: this.role.roleArn,
      // Uncached because calling '_checkEdgeCompatibility', which gets called in the resolve of another
      // Token, actually *modifies* the 'environment' map.
      environment: Lazy.uncachedAny({
        produce: () => this.renderEnvironment(),
      }),
      memorySize: properties.memorySize,
      vpcConfig: this.configureVpc(properties),
      deadLetterConfig: this.buildDeadLetterConfig(dlqTopicOrQueue),
      tracingConfig: this.buildTracingConfig(properties),
      reservedConcurrentExecutions: properties.reservedConcurrentExecutions,
      // imageConfig: undefinedIfNoKeys({
      //   command: code.image?.cmd,
      //   entryPoint: code.image?.entrypoint,
      //   workingDirectory: code.image?.workingDirectory,
      // }),
      kmsKeyArn: properties.environmentEncryption?.keyArn,
      fileSystemConfigs,
      codeSigningConfigArn: properties.codeSigningConfig?.codeSigningConfigArn,
      architectures: this._architecture ? [this._architecture.name] : undefined,
    })

    resource.node.addDependency(this.role)

    this.functionName = this.getResourceNameAttribute(resource.ref)
    this.functionArn = this.getResourceArnAttribute(resource.attrArn, {
      service: "lambda",
      resource: "function",
      resourceName: this.physicalName,
      arnFormat: ArnFormat.COLON_RESOURCE_NAME,
    })

    // this.runtime = properties.runtime
    this.timeout = properties.timeout

    this.architecture = properties.architecture ?? Architecture.X86_64

    if (properties.layers) {
      // if (properties.runtime === Runtime.FROM_IMAGE) {
      //   throw new Error(
      //     "Layers are not supported for container image functions",
      //   )
      // }

      this.addLayers(...properties.layers)
    }

    for (const event of properties.events || []) {
      this.addEventSource(event)
    }

    // Log retention
    if (properties.logRetention) {
      const logRetention = new logs.LogRetention(this, "LogRetention", {
        logGroupName: `/aws/lambda/${this.functionName}`,
        retention: properties.logRetention,
        role: properties.logRetentionRole,
        logRetentionRetryOptions:
          properties.logRetentionRetryOptions as logs.LogRetentionRetryOptions,
      })
      this._logGroup = logs.LogGroup.fromLogGroupArn(
        this,
        "LogGroup",
        logRetention.logGroupArn,
      )
    }

    codeFromFunction(properties.handler).then(({ code, tokens }) => {
      const codeConfig = code.bind(this)
      verifyCodeConfig(codeConfig, {
        ...properties,
        runtime: Runtime.NODEJS_14_X,
        code,
        handler: "index.handler",
      })

      resource.code = {
        s3Bucket: codeConfig.s3Location?.bucketName,
        s3Key: codeConfig.s3Location?.objectKey,
        s3ObjectVersion: codeConfig.s3Location?.objectVersion,
        // zipFile: codeConfig.inlineCode,
        // imageUri: codeConfig.image?.imageUri,
      }
      code.bindToResource(resource)

      for (const { construct, cfnToken, hash } of tokens) {
        this.node.addDependency(construct)
        this.addEnvironment(hash, cfnToken)
      }
    })

    // Event Invoke Config
    if (
      properties.onFailure ||
      properties.onSuccess ||
      properties.maxEventAge ||
      properties.retryAttempts !== undefined
    ) {
      this.configureAsyncInvoke({
        onFailure: properties.onFailure,
        onSuccess: properties.onSuccess,
        maxEventAge: properties.maxEventAge,
        retryAttempts: properties.retryAttempts,
      })
    }

    this.currentVersionOptions = properties.currentVersionOptions

    if (properties.filesystem) {
      if (!properties.vpc) {
        throw new Error(
          "Cannot configure 'filesystem' without configuring a VPC.",
        )
      }
      const config = properties.filesystem.config
      if (config.dependency) {
        this.node.addDependency(...config.dependency)
      }
      // There could be a race if the Lambda is used in a CustomResource. It is possible for the Lambda to
      // fail to attach to a given FileSystem if we do not have a dependency on the SecurityGroup ingress/egress
      // rules that were created between this Lambda's SG & the Filesystem SG.
      for (const sg of this.connections.securityGroups) {
        for (const child of sg.node.findAll()) {
          if (
            child instanceof CfnResource &&
            child.cfnResourceType === "AWS::EC2::SecurityGroupEgress"
          ) {
            resource.node.addDependency(child)
          }
        }
      }
      for (const sg of config.connections?.securityGroups ?? []) {
        for (const child of sg.node.findAll()) {
          if (
            child instanceof CfnResource &&
            child.cfnResourceType === "AWS::EC2::SecurityGroupIngress"
          ) {
            resource.node.addDependency(child)
          }
        }
      }
    }

    // Configure Lambda insights
    this.configureLambdaInsights(properties)
  }

  /**
   * Adds an environment variable to this Lambda function.
   * If this is a ref to a Lambda function, this operation results in a no-op.
   * @param key The environment variable key.
   * @param value The environment variable's value.
   * @param options Environment variable options.
   */
  public addEnvironment(
    key: string,
    value: string,
    options?: EnvironmentOptions,
  ): this {
    this.environment[key] = { value, ...options }
    return this
  }

  /**
   * Adds one or more Lambda Layers to this Lambda function.
   *
   * @param layers the layers to be added.
   *
   * @throws if there are already 5 layers on this function, or the layer is incompatible with this function's runtime.
   */
  public addLayers(...layers: ILayerVersion[]): void {
    for (const layer of layers) {
      if (this.layers.length === 5) {
        throw new Error(
          "Unable to add layer: this lambda function already uses 5 layers.",
        )
      }
      if (
        layer.compatibleRuntimes &&
        !layer.compatibleRuntimes.some((runtime) =>
          runtime.runtimeEquals(this.runtime),
        )
      ) {
        const runtimes = layer.compatibleRuntimes
          .map((runtime) => runtime.name)
          .join(", ")
        throw new Error(
          `This lambda function uses a runtime that is incompatible with this layer (${this.runtime.name} is not in [${runtimes}])`,
        )
      }

      // Currently no validations for compatible architectures since Lambda service
      // allows layers configured with one architecture to be used with a Lambda function
      // from another architecture.

      this.layers.push(layer)
    }
  }

  /**
   * Add a new version for this Lambda
   *
   * If you want to deploy through CloudFormation and use aliases, you need to
   * add a new version (with a new name) to your Lambda every time you want to
   * deploy an update. An alias can then refer to the newly created Version.
   *
   * All versions should have distinct names, and you should not delete versions
   * as long as your Alias needs to refer to them.
   *
   * @param name A unique name for this version.
   * @param codeSha256 The SHA-256 hash of the most recently deployed Lambda
   *  source code, or omit to skip validation.
   * @param description A description for this version.
   * @param provisionedExecutions A provisioned concurrency configuration for a
   * function's version.
   * @param asyncInvokeConfig configuration for this version when it is invoked
   * asynchronously.
   * @returns A new Version object.
   *
   * @deprecated This method will create an AWS::Lambda::Version resource which
   * snapshots the AWS Lambda function *at the time of its creation* and it
   * won't get updated when the function changes. Instead, use
   * `this.currentVersion` to obtain a reference to a version resource that gets
   * automatically recreated when the function configuration (or code) changes.
   */
  public addVersion(
    name: string,
    codeSha256?: string,
    description?: string,
    provisionedExecutions?: number,
    asyncInvokeConfig: EventInvokeConfigOptions = {},
  ): Version {
    return new Version(this, "Version" + name, {
      lambda: this,
      codeSha256,
      description,
      provisionedConcurrentExecutions: provisionedExecutions,
      ...asyncInvokeConfig,
    })
  }

  /**
   * The LogGroup where the Lambda function's logs are made available.
   *
   * If either `logRetention` is set or this property is called, a CloudFormation custom resource is added to the stack that
   * pre-creates the log group as part of the stack deployment, if it already doesn't exist, and sets the correct log retention
   * period (never expire, by default).
   *
   * Further, if the log group already exists and the `logRetention` is not set, the custom resource will reset the log retention
   * to never expire even if it was configured with a different value.
   */
  public get logGroup(): logs.ILogGroup {
    if (!this._logGroup) {
      const logRetention = new logs.LogRetention(this, "LogRetention", {
        logGroupName: `/aws/lambda/${this.functionName}`,
        retention: logs.RetentionDays.INFINITE,
      })
      this._logGroup = logs.LogGroup.fromLogGroupArn(
        this,
        `${this.node.id}-LogGroup`,
        logRetention.logGroupArn,
      )
    }
    return this._logGroup
  }

  /**
   * Configured lambda insights on the function if specified. This is acheived by adding an imported layer which is added to the
   * list of lambda layers on synthesis.
   *
   * https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights-extension-versions.html
   */
  private configureLambdaInsights(
    properties: FunctionProperties<any, any>,
  ): void {
    if (properties.insightsVersion === undefined) {
      return
    }
    // if (properties.runtime !== Runtime.FROM_IMAGE) {
    //   // Layers cannot be added to Lambda container images. The image should have the insights agent installed.
    //   // See https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Lambda-Insights-Getting-Started-docker.html
    //   this.addLayers(
    //     LayerVersion.fromLayerVersionArn(
    //       this,
    //       "LambdaInsightsLayer",
    //       properties.insightsVersion._bind(this, this).arn,
    //     ),
    //   )
    // }
    this.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "CloudWatchLambdaInsightsExecutionRolePolicy",
      ),
    )
  }

  private renderEnvironment() {
    if (!this.environment || Object.keys(this.environment).length === 0) {
      return
    }

    const variables: { [key: string]: string } = {}
    // Sort environment so the hash of the function used to create
    // `currentVersion` is not affected by key order (this is how lambda does
    // it). For backwards compatibility we do not sort environment variables in case
    // _currentVersion is not defined. Otherwise, this would have invalidated
    // the template, and for example, may cause unneeded updates for nested
    // stacks.
    const keys = this._currentVersion
      ? Object.keys(this.environment).sort()
      : Object.keys(this.environment)

    for (const key of keys) {
      // variables[key] = this.environment[key].value
      const { value } = this.environment[key] ?? {}
      if (value) {
        variables[key] = value
      }
    }

    return { variables }
  }

  /**
   * If configured, set up the VPC-related properties
   *
   * Returns the VpcConfig that should be added to the
   * Lambda creation properties.
   */
  private configureVpc(
    properties: FunctionProperties<any, any>,
  ): CfnFunction.VpcConfigProperty | undefined {
    if (properties.allowAllOutbound !== undefined && !properties.vpc) {
      throw new Error(
        "Cannot configure 'securityGroup' or 'allowAllOutbound' without configuring a VPC",
      )
    }

    if (!properties.vpc) {
      return undefined
    }

    if (properties.allowAllOutbound !== undefined) {
      throw new Error(
        "Configure 'allowAllOutbound' directly on the supplied SecurityGroup.",
      )
    }

    let securityGroups: ec2.ISecurityGroup[]

    if (properties.securityGroups) {
      throw new Error(
        "Only one of the function props, securityGroup or securityGroups, is allowed",
      )
    }

    if (properties.securityGroups) {
      securityGroups = properties.securityGroups
    } else {
      const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
        vpc: properties.vpc,
        description:
          "Automatic security group for Lambda Function " +
          Names.uniqueId(this),
        allowAllOutbound: properties.allowAllOutbound,
      })
      securityGroups = [securityGroup]
    }

    this._connections = new ec2.Connections({ securityGroups })

    if (properties.filesystem && properties.filesystem.config.connections) {
      properties.filesystem.config.connections.allowDefaultPortFrom(this)
    }

    const allowPublicSubnet = properties.allowPublicSubnet ?? false
    const { subnetIds } = properties.vpc.selectSubnets(properties.vpcSubnets)
    const publicSubnetIds = new Set(
      properties.vpc.publicSubnets.map((s) => s.subnetId),
    )
    for (const subnetId of subnetIds) {
      if (publicSubnetIds.has(subnetId) && !allowPublicSubnet) {
        throw new Error(
          "Lambda Functions in a public subnet can NOT access the internet. " +
            "If you are aware of this limitation and would still like to place the function int a public subnet, set `allowPublicSubnet` to true",
        )
      }
    }

    // List can't be empty here, if we got this far you intended to put your Lambda
    // in subnets. We're going to guarantee that we get the nice error message by
    // making VpcNetwork do the selection again.

    return {
      subnetIds,
      securityGroupIds: securityGroups.map((sg) => sg.securityGroupId),
    }
  }

  private isQueue(
    deadLetterQueue: sqs.IQueue | sns.ITopic,
  ): deadLetterQueue is sqs.IQueue {
    return (<sqs.IQueue>deadLetterQueue).queueArn !== undefined
  }

  private buildDeadLetterQueue(
    properties: FunctionProperties<any, any>,
  ): sqs.IQueue | sns.ITopic | undefined {
    if (
      !properties.deadLetterQueue &&
      !properties.deadLetterQueueEnabled &&
      !properties.deadLetterTopic
    ) {
      return undefined
    }
    if (
      properties.deadLetterQueue &&
      properties.deadLetterQueueEnabled === false
    ) {
      throw new Error(
        "deadLetterQueue defined but deadLetterQueueEnabled explicitly set to false",
      )
    }
    if (
      properties.deadLetterTopic &&
      (properties.deadLetterQueue ||
        properties.deadLetterQueueEnabled !== undefined)
    ) {
      throw new Error(
        "deadLetterQueue and deadLetterTopic cannot be specified together at the same time",
      )
    }

    let deadLetterQueue: sqs.IQueue | sns.ITopic
    if (properties.deadLetterTopic) {
      deadLetterQueue = properties.deadLetterTopic
      this.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["sns:Publish"],
          resources: [deadLetterQueue.topicArn],
        }),
      )
    } else {
      deadLetterQueue =
        properties.deadLetterQueue ||
        new sqs.Queue(this, "DeadLetterQueue", {
          retentionPeriod: Duration.days(14),
        })
      this.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["sqs:SendMessage"],
          resources: [deadLetterQueue.queueArn],
        }),
      )
    }

    return deadLetterQueue
  }

  private buildDeadLetterConfig(deadLetterQueue?: sqs.IQueue | sns.ITopic) {
    return deadLetterQueue
      ? {
          targetArn: this.isQueue(deadLetterQueue)
            ? deadLetterQueue.queueArn
            : deadLetterQueue.topicArn,
        }
      : undefined
  }

  private buildTracingConfig(properties: FunctionProperties<any, any>) {
    if (
      properties.tracing === undefined ||
      properties.tracing === Tracing.DISABLED
    ) {
      return
    }

    this.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
        resources: ["*"],
      }),
    )

    return {
      mode: properties.tracing,
    }
  }

  private validateProfiling(properties: FunctionProperties<any, any>) {
    // if (!properties.runtime.supportsCodeGuruProfiling) {
    //   throw new Error(
    //     `CodeGuru profiling is not supported by runtime ${properties.runtime.name}`,
    //   )
    // }
    if (
      properties.environment &&
      (properties.environment.AWS_CODEGURU_PROFILER_GROUP_ARN ||
        properties.environment.AWS_CODEGURU_PROFILER_ENABLED)
    ) {
      throw new Error(
        "AWS_CODEGURU_PROFILER_GROUP_ARN and AWS_CODEGURU_PROFILER_ENABLED must not be set when profiling options enabled",
      )
    }
  }
}

/**
 * Configuration for an environment variable
 */
interface EnvironmentConfig extends EnvironmentOptions {
  readonly value: string
}
