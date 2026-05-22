import dotenv from "dotenv";
dotenv.config();

const { DISCORD_PRIVATE_TOKEN, DISCORD_BASE_URL, DISCORD_APPLICATION_ID } = process.env;

if (!DISCORD_PRIVATE_TOKEN || !DISCORD_BASE_URL || !DISCORD_APPLICATION_ID) {
    throw new Error("Missing environment variables");
}

export const config = {
    DISCORD_PRIVATE_TOKEN,
    DISCORD_BASE_URL,
    DISCORD_APPLICATION_ID
}