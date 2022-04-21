import { IFunction } from "./function-base.js";

const tag = Symbol("@cloudy-ts/cdk/aws_lambda/function/inputType");

export interface IEventSource<InputType, OutputType = unknown> {
  /**
   * Called by `lambda.addEventSource` to allow the event source to bind to this
   * function.
   *
   * @param target That lambda function to bind to.
   */
  bind(target: IFunction<InputType, OutputType>): void;

  /**
   * This property is necessary because otherwise, TypeScript will allow
   * interchanging between event sources of different InputType's.
   *
   * Adding a property with the type InputType, will forbid interchanges
   * unless the InputType's are of the same shape.
   */
  readonly [tag]: InputType;
}

export abstract class BaseEventSource<InputType, OutputType = unknown>
  implements IEventSource<InputType>
{
  abstract bind(target: IFunction<InputType, OutputType>): void;

  declare readonly [tag]: InputType;
}
