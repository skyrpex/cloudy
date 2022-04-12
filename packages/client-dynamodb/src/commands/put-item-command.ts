import {
  PutItemCommand as BaseCommand,
  PutItemCommandInput as BaseCommandInput,
  PutItemCommandOutput as BaseCommandOutput,
  // DynamoDBClientResolvedConfig as ResolvedConfiguration,
  DynamoDBClientResolvedConfig,
  ReturnConsumedCapacity,
  ReturnItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb"
import { Command } from "@aws-sdk/smithy-client"
import { MiddlewareStack } from "@aws-sdk/types"

import { aws_dynamodb } from "@cloudy-ts/cdk"

import { ToAttributeMap } from "../attribute-value.js"
import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js"

export type PutItemCommandInput<
  PartitionKey extends aws_dynamodb.KeyDefinition = aws_dynamodb.KeyDefinition,
  SortKey extends aws_dynamodb.KeyDefinition | undefined = undefined,
  AccessPatterns extends aws_dynamodb.AccessPattern<
    PartitionKey,
    SortKey
  > = aws_dynamodb.AccessPattern<PartitionKey, SortKey>,
> = BaseCommandInput & {
  TableName: aws_dynamodb.TableName<PartitionKey, SortKey, AccessPatterns, any>
  Item: ToAttributeMap<AccessPatterns>
  // ReturnConsumedCapacity?: ReturnConsumedCapacity
  // ReturnItemCollectionMetrics?: ReturnItemCollectionMetrics
  // ConditionExpression?: string
  // ExpressionAttributeNames?: {
  //   [key: string]: string
  // }
  // ExpressionAttributeValues?: {
  //   [key: string]: AttributeValue
  // }
}

export interface PutItemCommandOutput extends BaseCommandOutput {}

/**
 * <p>Creates a new item, or replaces an old item with a new item. If an item that has the
 *             same primary key as the new item already exists in the specified table, the new item
 *             completely replaces the existing item. You can perform a conditional put operation (add
 *             a new item if one with the specified primary key doesn't exist), or replace an existing
 *             item if it has certain attribute values. You can return the item's attribute values in
 *             the same operation, using the <code>ReturnValues</code> parameter.</p>
 *         <important>
 *             <p>This topic provides general information about the <code>PutItem</code> API.</p>
 *             <p>For information on how to call the <code>PutItem</code> API using the Amazon Web Services SDK in specific languages, see the following:</p>
 *             <ul>
 *                <li>
 *                     <p>
 *                         <a href="http://docs.aws.amazon.com/goto/aws-cli/dynamodb-2012-08-10/PutItem"> PutItem in the Command Line Interface</a>
 *                     </p>
 *                 </li>
 *                <li>
 *                     <p>
 *                         <a href="http://docs.aws.amazon.com/goto/DotNetSDKV3/dynamodb-2012-08-10/PutItem"> PutItem in the SDK for .NET</a>
 *                     </p>
 *                 </li>
 *                <li>
 *                     <p>
 *                         <a href="http://docs.aws.amazon.com/goto/SdkForCpp/dynamodb-2012-08-10/PutItem"> PutItem in the SDK for C++</a>
 *                     </p>
 *                 </li>
 *                <li>
 *                     <p>
 *                         <a href="http://docs.aws.amazon.com/goto/SdkForGoV1/dynamodb-2012-08-10/PutItem"> PutItem in the SDK for Go</a>
 *                     </p>
 *                 </li>
 *                <li>
 *                     <p>
 *                         <a href="http://docs.aws.amazon.com/goto/SdkForJava/dynamodb-2012-08-10/PutItem"> PutItem in the SDK for Java</a>
 *                     </p>
 *                 </li>
 *                <li>
 *                     <p>
 *                         <a href="http://docs.aws.amazon.com/goto/AWSJavaScriptSDK/dynamodb-2012-08-10/PutItem"> PutItem in the SDK for JavaScript</a>
 *                     </p>
 *                 </li>
 *                <li>
 *                     <p>
 *                         <a href="http://docs.aws.amazon.com/goto/SdkForPHPV3/dynamodb-2012-08-10/PutItem"> PutItem in the SDK for PHP V3</a>
 *                     </p>
 *                 </li>
 *                <li>
 *                     <p>
 *                         <a href="http://docs.aws.amazon.com/goto/boto3/dynamodb-2012-08-10/PutItem">
 *                             PutItem in the SDK for Python (Boto)</a>
 *                     </p>
 *                 </li>
 *                <li>
 *                     <p>
 *                         <a href="http://docs.aws.amazon.com/goto/SdkForRubyV2/dynamodb-2012-08-10/PutItem"> PutItem in the SDK for Ruby V2</a>
 *                     </p>
 *                 </li>
 *             </ul>
 *         </important>
 *
 *         <p>When you add an item, the primary key attributes are the only required attributes.
 *             Attribute values cannot be null.</p>
 *         <p>Empty String and Binary attribute values are allowed. Attribute values of type String
 *             and Binary must have a length greater than zero if the attribute is used as a key
 *             attribute for a table or index. Set type attributes cannot be empty. </p>
 *         <p>Invalid Requests with empty values will be rejected with a
 *                 <code>ValidationException</code> exception.</p>
 *         <note>
 *             <p>To prevent a new item from replacing an existing item, use a conditional
 *                 expression that contains the <code>attribute_not_exists</code> function with the
 *                 name of the attribute being used as the partition key for the table. Since every
 *                 record must contain that attribute, the <code>attribute_not_exists</code> function
 *                 will only succeed if no matching item exists.</p>
 *         </note>
 *         <p>For more information about <code>PutItem</code>, see <a href="https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html">Working with
 *                 Items</a> in the <i>Amazon DynamoDB Developer Guide</i>.</p>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```tts
 * import { DynamoDBClient, PutItemCommand } from "@cloudy-ts/client-dynamodb";
 * const client = new DynamoDBClient(configuration);
 * const command = new PutItemCommand(input);
 * const response = await client.send(command);
 * ```
 *
 * @see {@link PutItemCommandInput} for command's `input` shape.
 * @see {@link PutItemCommandOutput} for command's `response` shape.
 * @see {@link DynamoDBClientResolvedConfig} for DynamoDBClient's `configuration` shape.
 *
 */
export class PutItemCommand<
  PartitionKey extends aws_dynamodb.KeyDefinition,
  SortKey extends aws_dynamodb.KeyDefinition | undefined,
  AccessPatterns extends aws_dynamodb.AccessPattern<PartitionKey, SortKey>,
> implements
    Command<BaseCommandInput, BaseCommandOutput, DynamoDBClientResolvedConfig>
{
  private readonly command: BaseCommand

  constructor(
    readonly input: PutItemCommandInput<PartitionKey, SortKey, AccessPatterns>,
  ) {
    this.command = new BaseCommand(input as unknown as BaseCommandInput)
  }

  get middlewareStack(): MiddlewareStack<BaseCommandInput, BaseCommandOutput> {
    return this.command.middlewareStack as any
  }

  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: DynamoDBClientResolvedConfig,
  ) {
    return this.command.resolveMiddleware(clientStack as any, configuration)
  }
}
