import { IFunction } from "./function-base.js";

const tag = Symbol("cloudy-cdk-lib.aws_lambda.IEventSource");

export interface IEventSource<InputType, OutputType = unknown> {
  /**
   * This property is necessary because otherwise, TypeScript will allow
   * interchanging between event sources of different InputType's.
   *
   * Adding a property with the type InputType, will forbid interchanges
   * unless the InputType's are of the same shape.
   */
  readonly [tag]: InputType;

  /**
   * Called by `lambda.addEventSource` to allow the event source to bind to this
   * function.
   *
   * @param target That lambda function to bind to.
   */
  bind(target: IFunction<InputType, OutputType>): void;
}

export abstract class BaseEventSource<InputType, OutputType = unknown>
  implements IEventSource<InputType>
{
  declare readonly [tag]: InputType;

  abstract bind(target: IFunction<InputType, OutputType>): void;
}
