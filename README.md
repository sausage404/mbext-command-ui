# Autocomplete Custom command for Minecraft Bedrock Development

[![npm version](https://badge.fury.io/js/%40mbext%2Fcommand-ui.svg)](https://badge.fury.io/js/%40mbext%2Fcommand-ui)

`@mbext/command-ui` A TypeScript tool that generates UI JSON files for Minecraft commands based on a configuration file, The original json ui file template was taken from [Pablo](https://www.youtube.com/@Pablo4517) following the [video](https://www.youtube.com/watch?v=5Er6ttStoCY)

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
npx @mbext/command-ui
```

The tool generates the following files in the ui directory:

* _global_variables.json: Global command prefix
* chat_screen.json: Chat interface configuration
* command_panel.json: Command panel layout
* command_config.json: Command definitions and possibilities
* _ui_defs.json: UI definitions index

## License

@mbext/command-ui is released under the [GNU General Public License v3](https://github.com/sausage404/mbext-command-ui/blob/main/LICENSE).

## Issues

If you encounter any problems or have suggestions, please file an issue on the GitHub repository.