import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, NewsChannel, ThreadChannel, DMChannel, type ChatInputCommandInteraction } from "discord.js";

export const createButton = async (interaction: ChatInputCommandInteraction) => {
    const buttonText = interaction.options.data[0]?.value as string ?? "Confirmer";
    const previousMessage = await interaction.channel?.messages.fetch({ limit: 50 });
    const lastMessage = previousMessage?.find(m => !m.author.bot && m.content.trim().length > 0);
    const originalMessage = lastMessage?.content;

    if (!originalMessage) {
        return interaction.reply({ content: "Aucun message trouvé", ephemeral: true });
    }

    if (!interaction?.channel?.isTextBased()) {
        return;
    }

    const channel = interaction.channel as TextChannel | NewsChannel | ThreadChannel | DMChannel;

    const confirmButton = new ButtonBuilder().setCustomId("confirm").setLabel(buttonText).setStyle(ButtonStyle.Success)
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton);

    try {
        const message = await channel.send({ content: originalMessage, components: [row] });
        await message?.pin();
        await interaction.reply({ content: "✅ Message copié avec bouton et épinglé !", ephemeral: true });
        await lastMessage?.delete();
    } catch (error) {
        console.error(error);
        return interaction.reply({ content: "Une erreur est survenue lors de la création du message et de l'épinglage", ephemeral: true });
    }
}