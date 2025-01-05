import type { Player } from "@minecraft/server";

export enum ArgumentType {
    String = 0,
    Number = 1,
    Boolean = 2,
    Player = 3
}

export type ArgumentValue = string | number | boolean | Player;

export type ArgumentValueMapping = {
    [ArgumentType.String]: string;
    [ArgumentType.Number]: number;
    [ArgumentType.Boolean]: boolean;
    [ArgumentType.Player]: Player;
}

export interface CommandExecutionContext {
    player: Player;
    subCommand: string[];
    argument: Record<string, any>;
    originalMessage: string;
}

export type CommandConfig = {
    prefix: string;
    commands: Record<string, {
        description: string;
        arguments?: Record<string, Argument>;
        allowedArguments?: Record<string, string[]>;
        subCommands?: SubCommand;
    }>;
}

export type Argument = {
    description: string;
    type: ArgumentType;
    required?: boolean;
    default?: ArgumentValue;
}

export type SubCommand = {
    required?: boolean;
    commands: Record<string, {
        subCommands?: SubCommand;
    }>;
}

export type ArgumentValidator = (value: ArgumentValue) => Promise<boolean> | boolean;

export type CommandExecutor = (context: CommandExecutionContext) => Promise<void> | void;