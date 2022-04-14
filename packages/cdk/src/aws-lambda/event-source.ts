import { IFunction } from "./function-base.js";

const inputTypeSymbol = Symbol("@cloudy-ts/cdk/aws_lambda/function/inputType");

export interface IEventSource<InputType> {
  /**
   * Called by `lambda.addEventSource` to allow the event source to bind to this
   * function.
   *
   * @param target That lambda function to bind to.
   */
  bind(target: IFunction<InputType, any>): void;

  /**
   * This property is necessary because otherwise, TypeScript will allow
   * interchanging between event sources of different InputType's.
   *
   * Adding a property with the type InputType, will forbid interchanges
   * unless the InputType's are of the same shape.
   */
  readonly [inputTypeSymbol]: InputType | undefined;
}

export abstract class BaseEventSource<InputType>
  implements IEventSource<InputType>
{
  abstract bind(target: IFunction<InputType, any>): void;

  readonly [inputTypeSymbol]!: InputType | undefined;
}
