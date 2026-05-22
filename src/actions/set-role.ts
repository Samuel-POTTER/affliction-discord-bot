import { type ChatInputCommandInteraction, GuildMember } from "discord.js";
import { SET_ROLE_ALLOWED } from "../constants/role.ts";

export const setRole = async (interaction: ChatInputCommandInteraction) => {
    const executor = interaction.member as GuildMember;
    const hasPermission = executor.roles.cache.some(r => SET_ROLE_ALLOWED.includes(r.name));

    if (!hasPermission) {
        return interaction.reply({ content: "Vous n'avez pas la permission d'utiliser cette commande", flags: 64 });
    }

    const member = interaction.options.getMember("user") as GuildMember;
    const role = interaction.options.getRole("role");

    if (!member || !role) {
        return interaction.reply({ content: "Utilisateur ou rôle introuvable", flags: 64 });
    }

    try {
        await member.roles.add(role.id);
        return interaction.reply({ content: `Rôle **${role.name}** attribué à **${member.displayName}** avec succès`, flags: 64 });
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: "Une erreur est survenue lors de l'attribution du rôle", flags: 64 });
    }
}
