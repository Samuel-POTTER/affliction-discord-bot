import { ChatInputCommandInteraction, GuildMember } from "discord.js"

export const renameUser = async (interaction: ChatInputCommandInteraction, newGuildName?: string) => {
    const member = interaction.member as GuildMember;
    const newGuildNickName = newGuildName || interaction?.options.data[0]?.value as string | undefined;

    if (!newGuildNickName) {
        return interaction.reply({ content: "Vous devez entrer un nouveau pseudo", ephemeral: true });
    }

    if (member.id === member.guild.ownerId) {
        return interaction.reply({ content: "Le propriétaire du serveur doit changer son pseudo manuellement", ephemeral: true });
    }

    try {
        await member.setNickname(newGuildNickName);
        return interaction.reply({ content: "Pseudo modifié avec succès", ephemeral: true });
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: "Une erreur est survenue lors de la modification du pseudo", ephemeral: true });
    }
}