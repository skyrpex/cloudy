import { IEventSource } from "./event-source.js";

export interface IFunction<InputType, OutputType> {
  /**
   * Adds an event source to this function.
   */
  addEventSource(source: IEventSource<InputType>): void;
}
