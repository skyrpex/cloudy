import { Command } from "@aws-sdk/smithy-client";
import { Handler, MetadataBearer, MiddlewareStack } from "@aws-sdk/types";

export class CommandProxy<
  Input extends ClientInput,
  Output extends ClientOutput,
  ResolvedClientConfiguration,
  ClientInput extends object = any,
  ClientOutput extends MetadataBearer = any,
> implements
    Command<
      Input,
      Output,
      ResolvedClientConfiguration,
      ClientInput,
      ClientOutput
    >
{
  constructor(
    private readonly command: Command<
      Input,
      Output,
      ResolvedClientConfiguration,
      ClientInput,
      ClientOutput
    >,
  ) {}

  get input(): Input {
    return this.command.input;
  }

  get middlewareStack(): MiddlewareStack<Input, Output> {
    return this.command.middlewareStack;
  }

  // abstract resolveMiddleware(stack: IMiddlewareStack<ClientInput, ClientOutput>, configuration: ResolvedClientConfiguration, options: any): Handler<Input, Output>;
  resolveMiddleware(
    clientStack: MiddlewareStack<ClientInput, ClientOutput>,
    configuration: ResolvedClientConfiguration,
    options: any,
  ): Handler<Input, Output> {
    return this.command.resolveMiddleware(clientStack, configuration, options);
  }
}
