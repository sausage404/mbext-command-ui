import { Player } from "@minecraft/server";
import { CommandConfig, CommandExecutor, CommandExecutionContext, ArgumentValidator, SubCommand } from "../types";
import { CommandError } from "./errors";
import { ArgumentParser } from "./argument-parser";

export class CommandHandler<T extends CommandConfig> {
    private readonly commandExecutors: Map<string, CommandExecutor> = new Map();
    private readonly argumentValidators: Map<string, Map<string, ArgumentValidator>> = new Map();

    constructor(private readonly commandConfig: T) {
        this.validateConfiguration();
    }

    private validateConfiguration() {
        if (!this.commandConfig?.prefix) {
            throw new Error('Command prefix is required in configuration');
        }
        if (!this.commandConfig?.commands || Object.keys(this.commandConfig.commands).length === 0) {
            throw new Error('At least one command must be defined in configuration');
        }
    }

    public async on(command: keyof T["commands"], executor: CommandExecutor): Promise<void> {
        const commandStr = String(command);
        if (!this.commandConfig.commands[commandStr]) {
            throw new CommandError(
                'INVALID_SYNTAX',
                `Command "${commandStr}" not found in configuration`,
                { command: commandStr }
            );
        }
        if (typeof executor !== 'function') {
            throw new CommandError(
                'EXECUTION_ERROR',
                'Executor must be a function',
                { command: commandStr }
            );
        }
        this.commandExecutors.set(commandStr, executor);
    }

    public async validate<C extends keyof T["commands"], A extends keyof T["commands"][C]["arguments"]>(
        command: C,
        argumentName: A,
        validator: ArgumentValidator
    ): Promise<void> {
        const commandStr = String(command);
        if (!this.argumentValidators.has(commandStr)) {
            this.argumentValidators.set(commandStr, new Map());
        }
        const validators = this.argumentValidators.get(commandStr)!;
        validators.set(String(argumentName), validator);
    }

    public async verify(messageContent: string): Promise<boolean> {
        if (!messageContent) return false;
        return messageContent.startsWith(this.commandConfig.prefix);
    }

    public async run(messageContent: string, player: Player): Promise<CommandExecutionContext> {
        this.validateRunParameters(messageContent, player);

        try {
            const [mainCommand, ...commandParts] = this.parseCommandParts(messageContent);

            if (!mainCommand) {
                throw new CommandError('INVALID_SYNTAX', 'No command specified');
            }

            const commandDefinition = this.validateCommandDefinition(mainCommand);
            const executor = this.validateExecutor(mainCommand);

            const subCommandStructure = await this.validateSubCommands(
                mainCommand,
                commandParts,
                commandDefinition.subCommands || { required: false, commands: {} }
            );

            const parsedArguments = await ArgumentParser.parseArguments(
                player,
                mainCommand,
                commandParts,
                commandDefinition.arguments || {},
                subCommandStructure.commandPositions,
                this.commandConfig.commands[mainCommand]?.allowedArguments || {},
                this.argumentValidators
            );

            const context: CommandExecutionContext = {
                player,
                subCommand: subCommandStructure.commandChain,
                argument: parsedArguments || {},
                originalMessage: messageContent
            };

            await executor(context);
            return context;

        } catch (error) {
            if (error instanceof CommandError)
                throw error;

            throw new CommandError(
                'EXECUTION_ERROR',
                'An unexpected error occurred while executing the command',
                { originalError: error }
            );
        }
    }

    private validateRunParameters(messageContent: string, player: Player) {
        if (!messageContent?.trim()) {
            throw new CommandError('INVALID_SYNTAX', 'Empty command');
        }

        if (!player) {
            throw new CommandError('EXECUTION_ERROR', 'Player is required');
        }
    }

    private validateCommandDefinition(mainCommand: string) {
        const commandDefinition = this.commandConfig.commands[mainCommand];
        if (!commandDefinition) {
            throw new CommandError(
                'INVALID_SYNTAX',
                `Command "${mainCommand}" not found`,
                { command: mainCommand }
            );
        }
        return commandDefinition;
    }

    private validateExecutor(mainCommand: string) {
        const executor = this.commandExecutors.get(mainCommand);
        if (!executor) {
            throw new CommandError(
                'EXECUTION_ERROR',
                `No executor registered for command "${mainCommand}"`,
                { command: mainCommand }
            );
        }
        return executor;
    }

    private parseCommandParts(messageContent: string): string[] {
        const allowedPrefixes = ["@p", "@r", "@a", "@s", "@e"];
        return messageContent
            .slice(this.commandConfig.prefix.length)
            .trim()
            .match(/([^\s"']+|"([^"])"|'([^'])')/g)
            ?.map(part => {
                if (allowedPrefixes.includes(part)) {
                    return part;
                }
                return part.replace(/^@/, '').replace(/^['"]|['"]$/g, '').trim();
            })
            .filter(Boolean)
            || [];
    }


    private async validateSubCommands(
        mainCommand: string,
        commandParts: string[],
        subCommandConfig: SubCommand
    ): Promise<{
        isValid: boolean;
        commandChain: string[];
        commandPositions: number[];
    }> {
        const commandChain: string[] = [];
        const commandPositions: number[] = [];

        const possiblePositions = this.calculateSubCommandPositions(
            mainCommand,
            commandParts
        );

        if (possiblePositions.length === 0 && subCommandConfig.required) {
            throw new CommandError(
                'INVALID_SUBCOMMAND',
                'Subcommand is required but not provided',
                { availableCommands: Object.keys(subCommandConfig.commands) }
            );
        }

        for (const position of possiblePositions) {
            if (position >= commandParts.length) {
                continue;
            }

            const currentPart = commandParts[position].toLowerCase();

            if (currentPart in subCommandConfig.commands) {
                commandChain.push(currentPart);
                commandPositions.push(position);

                const nextConfig = subCommandConfig.commands[currentPart].subCommands;
                if (nextConfig && nextConfig.required && position === commandParts.length - 1) {
                    throw new CommandError(
                        'INVALID_SUBCOMMAND',
                        `Nested subcommand is required after "${currentPart}"`,
                        { parentCommand: currentPart }
                    );
                }
                subCommandConfig = nextConfig || { required: false, commands: {} };
            } else if (subCommandConfig.required) {
                throw new CommandError(
                    'INVALID_SUBCOMMAND',
                    `Invalid subcommand "${currentPart}"`,
                    {
                        invalidCommand: currentPart,
                        availableCommands: Object.keys(subCommandConfig.commands)
                    }
                );
            }
        }

        return {
            isValid: true,
            commandChain,
            commandPositions
        };
    }

    private calculateSubCommandPositions(
        mainCommand: string,
        commandParts: string[]
    ): number[] {
        const positions: number[] = [];
        const config = this.commandConfig.commands[mainCommand];
        if (!config?.allowedArguments) return positions;

        let currentPosition = 0;

        if (config.allowedArguments.main) {
            currentPosition += config.allowedArguments.main.length;
        }
        positions.push(currentPosition);

        for (let i = currentPosition; i < commandParts.length; i++) {
            const part = commandParts[i];
            for (const subName in config.allowedArguments) {
                if (subName !== 'main' && part === subName) {
                    const nextPosition = i + config.allowedArguments[subName].length + 1;
                    if (nextPosition < commandParts.length) {
                        positions.push(nextPosition);
                    }
                }
            }
        }

        return positions;
    }
}