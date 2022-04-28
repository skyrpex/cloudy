import { IFunction as IBaseFunction } from "aws-cdk-lib/aws-lambda";
import { IEventSource } from "./event-source.js";

export interface IFunction<InputType = any, OutputType = any>
  extends IBaseFunction {
  /**
   * Adds an event source to this function.
   */
  addEventSource(source: IEventSource<InputType>): void;
}
