# Custom Command for Minecraft Bedrock Development

[![npm version](https://badge.fury.io/js/%40mbext%2Fcommand-ui.svg)](https://badge.fury.io/js/%40mbext%2Fcommand-ui)

`@mbext/command-ui` A TypeScript tool that generates UI JSON files for Minecraft commands based on a configuration file, The original json ui file template was taken from [Pablo](https://www.youtube.com/@Pablo4517) following the https://www.youtube.com/watch?v=5Er6ttStoCY

## Features

- Generates UI components for command panels and chat screens
- Supports nested subcommands
- Handles different argument types (String, Number, Boolean, Player)
- Automatic command possibilities generation
- String obfuscation for security
  
## Usage

You can use this package directly with npx without installing it globally.
And in the project, it must be used with `command.config.json` files, but if you want a handler command, use the following package [`@mbext/command-handler`](https://github.com/sausage404/mbext-command-handler)

```bash
npx create-command-ui
```

The tool generates the following files in the ui directory:

* _global_variables.json: Global command prefix
* chat_screen.json: Chat interface configuration
* command_panel.json: Command panel layout
* command_config.json: Command definitions and possibilities
* _ui_defs.json: UI definitions index

## License

This project is licensed under a custom license. The key points of this license are:

1. You may use this software for both personal and commercial purposes.
2. Redistribution is allowed, but you must include this license and the copyright notice.
3. Modification or creation of derivative works is prohibited without explicit permission from the copyright holder.
4. You may not sublicense, sell, lease, or rent this software.
5. Attribution to the original author (sausage404) is required in projects or products using this software.
6. Reverse engineering is prohibited unless explicitly authorized by law.

For the full license text, please see the [LICENSE](./LICENSE) file in this repository.

## Issues

If you encounter any problems or have suggestions, please file an issue on the GitHub repository.