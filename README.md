# Custom Command for Minecraft Bedrock deverlopment

[![npm version](https://badge.fury.io/js/%40mbext%2Fcommand.svg)](https://badge.fury.io/js/%40mbext%2Fcommand)

`@mbext/command` is a library that allows you to create custom commands for Minecraft Bedrock development, including autocompletion and command handling.

## Features

- Type-safe command handling with TypeScript
- Support for nested subcommands
- Argument validation and type conversion
- Built for Minecraft Bedrock Edition
- Error handling and validation
- Autocompletion for commands
- Command execution with arguments and options

## Usage

You can use this package directly with npx without installing it globally.

### Available Commands

1. **Initialize a new project**

   ```bash
   npx @mbext/command init
   ```

   This command will initialize a new json config in the current directory.

2. **Compile the project**

   ```bash
   npx @mbext/command ui
   ```

   Create a new json ui for autocomplate command from `command.config.json`.

### Examples

This a type for config arguments

```ts
export enum ArgumentType {
    String = 0,
    Number = 1,
    Boolean = 2,
    Player = 3
}
```

You can config command in file `command.config.json`.

```json
{
    "prefix": "!",
    "commands": {
      "give": {
        "description": "Give an item to a player",
        "arguments": {
          "player": {
            "description": "The player to give the item to",
            "type": 0
          },
          "item": {
            "description": "The item to give",
            "type": 0
          },
          "amount": {
            "description": "The amount of the item to give",
            "type": 1
          }
        },
        "allowedArguments": {
          "main": [
            "player",
            "item",
            "amount"
          ]
        }
      }
    }
}
```
When you config command in file `command.config.json`, you can use command like this

```ts
import { world } from '@minecraft/server'
import { CommandHandler } from '@mbext/command'
import commandConfig from './command.config.json'

const handler = new CommandHandler(commandConfig);

handler.validate("give", "item", (argument) => {
   if(!argument.item.startsWith("minecraft:")) 
      return false
   if(!argument.amount < 1)
      return false
   return true
})

handler.on("give", ({ player, argument }) => {
   const inventory = (player.getComponent("inventory") as EntityInventoryComponent);
   const container = inventory.container;
   const item = new ItemStack(argument.item, argument.amount)
   container?.addItem(item);
})

world.beforeEvent.chatSend.subscribe((data) => {
   const player = data.sender;
   const message = data.message;
   if(handler.verify(message)){
      event.cancel = true;
      handler.run(message, player);
   }
})
```

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