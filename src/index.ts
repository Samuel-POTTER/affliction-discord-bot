import "dotenv/config";
import renameUser from "./commands/rename-user.json" with { type: "json" };
import createAccess from "./commands/create-access.json" with { type: "json" };
import setRole from "./commands/set-role.json" with { type: "json" };
import { REST, Routes } from "discord.js";
import { config } from "./config.ts";

const commands = [
    renameUser,
    createAccess,
    setRole
]


const rest = new REST({ version: "10" }).setToken(config.DISCORD_PRIVATE_TOKEN);

try {
    console.log("Started refreshing application commands.");
    await rest.put(Routes.applicationCommands(config.DISCORD_APPLICATION_ID), { body: commands });
    console.log("Successfully reloaded application commands.");
} catch (error) {
    console.error(error);
}