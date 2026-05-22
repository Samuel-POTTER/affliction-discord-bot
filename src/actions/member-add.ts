import type { GuildMember } from "discord.js";
import { NEW_JOINER_ROLE } from "../constants/role.ts";
import { getGuildRoles } from "../utils.ts";

export const memberAdd = async (member: GuildMember) => {
    const allRoles = await getGuildRoles(member.guild);

    const newJoinerRole = allRoles.find(role => role.name.toLocaleLowerCase() === NEW_JOINER_ROLE);

    if (!newJoinerRole) {
        return;
    }

    await member.roles.add(newJoinerRole.id);
}