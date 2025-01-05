import { Argument, ArgumentType, CommandConfig, SubCommand } from '../types';
import chalk from 'chalk';

function getCommandPossibilities(config: CommandConfig) {
    const formatArgs = (args: Record<string, string[]>, cmdArgs: Record<string, Argument>) => {
        return Object.entries(args).reduce((acc, [name, argNames]) => {
            acc[name] = argNames
                .map(arg => formatArgument(arg, cmdArgs[arg], !cmdArgs[arg]?.required))
                .join(' ');
            return acc;
        }, {} as Record<string, string>);
    };

    const buildCommandString = (prefix: string, cmdName: string, subPath: string[] = [], args: string = '') => {
        return [`${prefix}${cmdName}`, ...subPath, args].filter(Boolean).join(' ').trim();
    };

    const processSubCommands = (
        prefix: string,
        cmdName: string,
        subCmds: SubCommand,
        mainArgs: string = '',
        basePath: string[] = []
    ): string[] => {
        const results: string[] = [];
        
        for (const [subName, subCmd] of Object.entries(subCmds.commands)) {
            const currentPath = [...basePath, subName];
            const cmdString = buildCommandString(prefix, cmdName, currentPath, mainArgs);
            
            if (subCmd.subCommands) {
                results.push(...processSubCommands(prefix, cmdName, subCmd.subCommands, mainArgs, currentPath));
            }
            results.push(cmdString);
        }
        
        return results;
    };

    return Object.entries(config.commands).map(([cmdName, cmd]) => {
        const possibilities: string[] = [];
        const formattedArgs = cmd.arguments && cmd.allowedArguments 
            ? formatArgs(cmd.allowedArguments, cmd.arguments)
            : {};

        if (formattedArgs.main) {
            possibilities.push(buildCommandString(config.prefix, cmdName, [], formattedArgs.main));
        }
        
        if (cmd.subCommands) {
            possibilities.push(...processSubCommands(
                config.prefix,
                cmdName,
                cmd.subCommands,
                formattedArgs.main || ''
            ));
        }

        return {
            commandName: cmdName,
            description: cmd.description || '',
            possibilities: possibilities.length > 0 ? possibilities : [buildCommandString(config.prefix, cmdName)]
        };
    });
}


function formatArgument(argName: string, arg: Argument, isOptional: boolean): string {
    const placeholder = getArgumentPlaceholder(arg);
    const defaultValue = arg.default !== undefined ? `=${arg.default}` : '';
    return isOptional
        ? `[${argName}:${placeholder}${defaultValue}]`
        : `<${argName}:${placeholder}>`;
}

function getArgumentPlaceholder(arg: Argument): string {
    switch (arg.type) {
        case ArgumentType.String:
            return 'text';
        case ArgumentType.Number:
            return 'int';
        case ArgumentType.Boolean:
            return 'boolean';
        case ArgumentType.Player:
            return 'player';
        default:
            return 'unknown';
    }
}


export { getCommandPossibilities }

function unicodeEscape(str: string): string {
    let result = "";
    for (let i = 0; i < str.length; i++) {
        const char = str[i] + str[i + 1];
        const charCode = str.charCodeAt(i);
        if (char === "\\n") {
            result += "\\n";
            i++;
        } else {
            result += "\\u" + ("0000" + charCode.toString(16)).slice(-4);
        }
    }
    return result;
}

function obfuscateString(str: string): string {
    return str.replace(/"[^\"]*"/g, (match) => {
        const cleanString = match.replace(/["]+/g, '');
        return '"' + unicodeEscape(cleanString) + '"';
    });
}

export function obfuscate(jsonObject: Object): string {
    const jsonString = JSON.stringify(jsonObject, null, 4);
    return obfuscateString(jsonString);
}

export const colorlog = {
    success: (message: string, highlight?: string) => console.log(chalk.green('✔'), chalk.bold(message), chalk.cyan(highlight ?? '')),
    error: (message: string, highlight?: string) => console.log(chalk.red('✘'), chalk.bold(message), chalk.cyan(highlight ?? '')),
    loader: (message: string, highlight?: string) => console.log(chalk.gray('⧗'), chalk.bold(message), chalk.cyan(highlight ?? ''))
}