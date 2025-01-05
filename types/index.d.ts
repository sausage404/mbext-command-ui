import { Player } from "@minecraft/server";

export enum ArgumentType {
    String = 0,
    Number = 1,
    Boolean = 2,
    Player = 3
}

export type ArgumentValue = string | number | boolean | Player | null;

export type ArgumentValidator = (value: ArgumentValue) => boolean;

export interface Argument {
    type: ArgumentType;
    required?: boolean;
    default?: ArgumentValue;
}

export interface SubCommand {
    required: boolean;
    commands: Record<string, {
        subCommands?: SubCommand;
    }>;
}

export interface CommandConfig {
    prefix: string;
    commands: Record<string, {
        description: string;
        arguments?: Record<string, Argument>;
        subCommands?: SubCommand;
        allowedArguments?: Record<string, string[]>;
    }>;
}

export interface CommandExecutionContext {
    player: Player;
    subCommand: string[];
    argument: Record<string, any>;
    originalMessage: string;
}

export type CommandExecutor = (context: CommandExecutionContext) => Promise<void>;

// errors.d.ts
export class CommandError extends Error {
    readonly type: 'INVALID_SYNTAX' | 'INVALID_ARGUMENT' | 'INVALID_SUBCOMMAND' | 'PERMISSION_DENIED' | 'EXECUTION_ERROR';
    readonly details?: any;

    constructor(
        type: 'INVALID_SYNTAX' | 'INVALID_ARGUMENT' | 'INVALID_SUBCOMMAND' | 'PERMISSION_DENIED' | 'EXECUTION_ERROR',
        message: string,
        details?: any
    );
}

export class CommandHandler<T extends CommandConfig> {
    constructor(commandConfig: T);

    on(command: keyof T["commands"], executor: CommandExecutor): Promise<void>;

    validate<C extends keyof T["commands"], A extends keyof T["commands"][C]["arguments"]>(
        command: C,
        argumentName: A,
        validator: ArgumentValidator
    ): Promise<void>;

    verify(messageContent: string): Promise<boolean>;

    run(messageContent: string, player: Player): Promise<CommandExecutionContext>;
}