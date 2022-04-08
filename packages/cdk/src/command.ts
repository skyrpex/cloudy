export interface Command<Input, Output, Context> {
  send(context: Context): Promise<Output>
}
