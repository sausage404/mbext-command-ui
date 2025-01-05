import { program } from "commander";
import init from "./cmd/init";
import { colorlog } from "./utils";
import ui from "./cmd/ui";

program
    .name("Minecraft Custom Command")
    .description("This is a tools handlers custom command and autocomplate command by json ui")

program
    .command("init")
    .description("Create a new json template in the current director")
    .action(() => init()
        .catch((error) => {
            colorlog.error('Failed to initialize')
            console.error(error)
            process.exit(1);
        })
    )

program
    .command("ui")
    .description("Create a new json ui for autocomplate command")
    .action(async () => await ui()
        .catch((error) => {
            colorlog.error('Failed to initialize')
            console.error(error)
            process.exit(1);
        })
    )

program.parse(process.argv);