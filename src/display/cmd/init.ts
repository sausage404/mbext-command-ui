import fs from 'fs-extra';
import path from 'path';
import { execSync } from "child_process";
import { colorlog } from '../utils';

export default async () => {
    execSync("npm i -D @mbext/command", { cwd: process.cwd() })

    const existsConfig = await fs.exists(path.resolve(process.cwd(), "command.config.json"))

    if (existsConfig)
        return;

    await fs.writeJSON(path.resolve(process.cwd(), "command.config.json"), {
        prefix: "!",
        commands: {}
    })

    colorlog.success("Initialize successfully", path.resolve(process.cwd(), "command.config.json"))
}