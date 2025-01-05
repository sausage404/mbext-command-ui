import fs from 'fs-extra';
import path from 'path';

import chat_screen from "../assets/chat_screen.json";
import command_panel from "../assets/command_panel.json";

import { colorlog, getCommandPossibilities, obfuscate } from '../utils';

export default async () => {
    if (!(await fs.exists(path.resolve(process.cwd(), 'command.config.json'))))
        throw Error('Missing file command.config.json in scripts folder');

    const command = await fs.readJSON(path.resolve(process.cwd(), 'command.config.json'));

    if (!(await fs.exists(path.resolve(process.cwd(), 'ui'))))
        await fs.mkdir(path.resolve(process.cwd(), 'ui'))

    await fs.writeFile(path.resolve(process.cwd(), 'ui', '_global_variables.json'), obfuscate({
        $command_prefix: command.prefix
    }));

    await fs.writeFile(path.resolve(process.cwd(), 'ui', 'chat_screen.json'), obfuscate({
        ...chat_screen
    }))

    await fs.writeFile(path.resolve(process.cwd(), 'ui', 'command_panel.json'), obfuscate({
        ...command_panel
    }))

    await fs.writeFile(path.resolve(process.cwd(), 'ui', '_ui_defs.json'), obfuscate({
        "ui_defs": [
            "ui/command_config.json",
            "ui/command_panel.json"
        ]
    }))

    console.log(getCommandPossibilities(command))

    await fs.writeFile(path.resolve(process.cwd(), 'ui', 'command_config.json'), obfuscate({
        namespace: "custom_command_config",
        "commands@custom_command_panel.commands_stack": {
            "$commands": getCommandPossibilities(command).map(cmd => ({
                "pay@custom_command_panel.custom_command_item_overview": {
                    "$command": cmd.commandName,
                    "$command_length": cmd.commandName.length,
                    "$command_description": cmd.description,
                    "$command_option": cmd.possibilities.join('\n')
                }
            }))
        }
    }))

    colorlog.success("Create ui json successfully", path.resolve(process.cwd(), 'ui'))
}