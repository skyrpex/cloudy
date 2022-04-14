import { aws_sns } from "aws-cdk-lib";

const subscriptionSymbol = Symbol("@cloudy-ts/cdk/aws_sns/subscription");

export interface ITopicSubscription<Message extends string>
  extends aws_sns.ITopicSubscription {
  // /**
  //  * Called by `lambda.addEventSource` to allow the event source to bind to this
  //  * function.
  //  *
  //  * @param target That lambda function to bind to.
  //  */
  // bind(target: IFunction<InputType, any>): void

  /**
   * This property is necessary because otherwise, TypeScript will allow
   * interchanging between event sources of different InputType's.
   *
   * Adding a property with the type InputType, will forbid interchanges
   * unless the InputType's are of the same shape.
   */
  readonly [subscriptionSymbol]: Message | undefined;
}

export abstract class BaseTopicSubscription<Message extends string>
  implements ITopicSubscription<Message>
{
  // abstract bind(target: IFunction<InputType, any>): void

  readonly [subscriptionSymbol]!: Message | undefined;

  abstract bind(topic: aws_sns.ITopic): aws_sns.TopicSubscriptionConfig;
}
