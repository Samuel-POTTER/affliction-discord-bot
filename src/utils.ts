import type { Collection, Guild, GuildMember } from "discord.js";

type Role = {
    name: "Nouveau" | "Temporary" | "Porte-Malédiction" | "Initié du Mal" | "Enchaîné" | "Profane" | "Marqué du Sceau" | "Porte-Fléau";
    id: string;
}

export const getGuildRoles = async (guild: Guild) => {
    return guild.roles.cache.reduce((acc: { name: string, id: string }[], role) => {
        acc.push({
            name: role.name.toLocaleLowerCase(),
            id: role.id,
        });
        return acc;
    }, [] as { name: string, id: string }[]);
}

export const getGuildChannels = async (guilds: Collection<string, Guild>) => {
    const channels = guilds.reduce((acc: { name: string, id: string }[], guild) => {
        acc.push(...guild.channels.cache.map(channel => ({
            name: channel.name.toLocaleLowerCase(),
            id: channel.id,
        })));
        return acc;
    }, [] as { name: string, id: string }[]);
    return channels;
}

export const setUserRole = async (member: GuildMember, newRole: Pick<Role, "name">) => {
    const allRoles = await getGuildRoles(member.guild);
    const userRole = allRoles.find(r => r.name.toLocaleLowerCase() === newRole.name.toLocaleLowerCase());
    if (!userRole) {
        return;
    }

    await member.roles.add(userRole.id);
}