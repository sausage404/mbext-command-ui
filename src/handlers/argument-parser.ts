import { Player, world } from "@minecraft/server";
import { ArgumentType, ArgumentValue, Argument, ArgumentValidator } from "../types";
import { CommandError } from "./errors";

export class ArgumentParser {
    public static async convertArgumentValue(player: Player, value: string, type: ArgumentType): Promise<any | null> {
        try {
            switch (type) {
                case ArgumentType.String:
                    return value;
                case ArgumentType.Number:
                    const num = Number(value);
                    return isFinite(num) ? num : null;
                case ArgumentType.Boolean:
                    const lowerValue = value.toLowerCase();
                    return lowerValue === 'true' ? true :
                        lowerValue === 'false' ? false : null;
                case ArgumentType.Player:
                    switch (value) {
                        case "@a":
                            return world.getAllPlayers();
                        case "@p":
                            return world.getAllPlayers().map((target) => {
                                const playerPhase = Object.values(player.location).reduce((a, b) => a + b, 0);
                                const targetPhase = Object.values(target.location).reduce((a, b) => a + b, 0);
                                return targetPhase - playerPhase;
                            }).sort((a, b) => a - b)[0];
                        case "@r":
                            const targets = world.getAllPlayers();
                            const random = Math.floor(Math.random() * targets.length);
                            return targets[random];
                        case "@s":
                            return player;
                        case "@e":
                            return player.dimension.getEntities();
                        default:
                            return world.getAllPlayers().find((player) => player.name === value)
                    }
                default:
                    return null;
            }
        } catch {
            return null;
        }
    }

    public static async parseArguments(
        player: Player,
        mainCommand: string,
        commandParts: string[],
        argumentDefinitions: Record<string, Argument>,
        usedPositions: number[],
        allowedArguments: Record<string, string[]>,
        argumentValidators: Map<string, Map<string, ArgumentValidator>>
    ): Promise<Record<string, ArgumentValue>> {
        const parsedArgs: Record<string, any> = {};
        if (!allowedArguments) return null;

        let currentPosition = 0;
        const mainArgs = allowedArguments['main'] || [];

        // Parse main arguments
        await ArgumentParser.parseMainArguments(
            player,
            mainArgs,
            commandParts,
            argumentDefinitions,
            usedPositions,
            currentPosition,
            parsedArgs,
            mainCommand,
            argumentValidators
        );

        // Parse subcommand arguments
        await ArgumentParser.parseSubCommandArguments(
            player,
            usedPositions,
            commandParts,
            allowedArguments,
            argumentDefinitions,
            parsedArgs
        );

        return parsedArgs;
    }

    private static async parseMainArguments(
        player: Player,
        mainArgs: string[],
        commandParts: string[],
        argumentDefinitions: Record<string, Argument>,
        usedPositions: number[],
        currentPosition: number,
        parsedArgs: Record<string, any>,
        mainCommand: string,
        argumentValidators: Map<string, Map<string, ArgumentValidator>>
    ) {
        for (const argName of mainArgs) {
            const argDef = argumentDefinitions[argName];
            if (!argDef) continue;

            if (currentPosition >= commandParts.length) {
                ArgumentParser.handleMissingArgument(argDef, argName, parsedArgs);
                continue;
            }

            if (usedPositions.includes(currentPosition)) {
                currentPosition++;
                continue;
            }

            await ArgumentParser.validateAndParseArgument(
                player,
                commandParts[currentPosition],
                argDef,
                argName,
                mainCommand,
                argumentValidators,
                parsedArgs
            );
            currentPosition++;
        }
    }

    private static async parseSubCommandArguments(
        player: Player,
        usedPositions: number[],
        commandParts: string[],
        allowedArguments: Record<string, string[]>,
        argumentDefinitions: Record<string, Argument>,
        parsedArgs: Record<string, any>
    ) {
        for (let i = 0; i < usedPositions.length; i++) {
            const subCmdPosition = usedPositions[i];
            const subCmdName = commandParts[subCmdPosition];
            const subCmdArgs = allowedArguments[subCmdName] || [];

            if (subCmdArgs.length > 0) {
                const subCmdParsedArgs = {};
                const nextSubCmdPosition = usedPositions[i + 1] || commandParts.length;

                await ArgumentParser.parseSubCommandArgumentsSet(
                    player,
                    subCmdArgs,
                    subCmdPosition,
                    nextSubCmdPosition,
                    commandParts,
                    argumentDefinitions,
                    subCmdName,
                    subCmdParsedArgs
                );

                if (Object.keys(subCmdParsedArgs).length > 0) {
                    parsedArgs[subCmdName] = subCmdParsedArgs;
                }
            }
        }
    }

    private static async parseSubCommandArgumentsSet(
        player: Player,
        subCmdArgs: string[],
        subCmdPosition: number,
        nextSubCmdPosition: number,
        commandParts: string[],
        argumentDefinitions: Record<string, Argument>,
        subCmdName: string,
        subCmdParsedArgs: Record<string, any>
    ) {
        let subArgPosition = subCmdPosition + 1;

        for (const argName of subCmdArgs) {
            const argDef = argumentDefinitions[argName];
            if (!argDef) continue;

            if (subArgPosition >= nextSubCmdPosition) {
                if (argDef.required) {
                    throw new CommandError(
                        'INVALID_ARGUMENT',
                        `Argument "${argName}" for subcommand "${subCmdName}" is required but not provided.`,
                        { argumentName: argName, subCommand: subCmdName }
                    );
                }
                if (argDef.default !== undefined) {
                    subCmdParsedArgs[argName] = argDef.default;
                }
                continue;
            }

            const value = commandParts[subArgPosition];
            const convertedValue = await ArgumentParser.convertArgumentValue(player, value, argDef.type);

            if (convertedValue === null) {
                throw new CommandError(
                    'INVALID_ARGUMENT',
                    `Invalid value for argument "${argName}" in subcommand "${subCmdName}".`,
                    { argumentName: argName, subCommand: subCmdName, expectedType: argDef.type, receivedValue: value }
                );
            }

            subCmdParsedArgs[argName] = convertedValue;
            subArgPosition++;
        }
    }

    private static handleMissingArgument(
        argDef: Argument,
        argName: string,
        parsedArgs: Record<string, any>
    ) {
        if (argDef.required) {
            throw new CommandError(
                'INVALID_ARGUMENT',
                `Argument "${argName}" is required but not provided.`,
                { argumentName: argName }
            );
        }
        if (argDef.default !== undefined) {
            parsedArgs[argName] = argDef.default;
        }
    }

    private static async validateAndParseArgument(
        player: Player,
        value: string,
        argDef: Argument,
        argName: string,
        mainCommand: string,
        argumentValidators: Map<string, Map<string, ArgumentValidator>>,
        parsedArgs: Record<string, any>
    ) {
        const convertedValue = await ArgumentParser.convertArgumentValue(player, value, argDef.type);

        if (convertedValue === null) {
            throw new CommandError(
                'INVALID_ARGUMENT',
                `Invalid value for argument "${argName}".`,
                { argumentName: argName, expectedType: argDef.type, receivedValue: value }
            );
        }

        if (argumentValidators.has(mainCommand) &&
            argumentValidators.get(mainCommand).get(argName) &&
            !argumentValidators.get(mainCommand).get(argName)(convertedValue)) {
            throw new CommandError(
                'INVALID_ARGUMENT',
                `Argument "${argName}" failed validation.`,
                { argumentName: argName }
            );
        }

        parsedArgs[argName] = convertedValue;
    }
}