import { ActionRowBuilder, Client, Events, GatewayIntentBits, GuildMember, LabelBuilder, ModalBuilder, StringSelectMenuBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import { config } from "./config.ts";
import { renameUser } from "./actions/rename.ts";
import { NEW_JOINER_ROLE, ROLE_SELECT_EXCLUDED, SET_ROLE_ALLOWED, TEMPORARY_ROLE } from "./constants/role.ts";
import { getGuildChannels, setUserRole } from "./utils.ts";
import { createButton } from "./actions/create-button.ts";
import { setRole } from "./actions/set-role.ts";
import { schedule } from "node-cron";
import { ANNONCE_CHANNEL, JOBS_CHANNEL, ROLE_ATTRIBUTION_CHANNEL, WELCOME_CHANNEL } from "./constants/channel.ts";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.on(Events.ClientReady, async (client) => {
    console.log(`Logged in as ${client.user.tag}`);

    const guildChannels = await getGuildChannels(client.guilds.cache);

    const generalChannel = guildChannels.find(channel => channel.name.toLocaleLowerCase() === ANNONCE_CHANNEL);

    if (!generalChannel) {
        return;
    }

    const channel = client.channels.cache.get(generalChannel.id) as TextChannel;
    
    schedule("0 0 8 * * 0", async () => {
        channel.send("Bonjour bonjour @everyone ! Il vous reste 24h pour compléter au maximum vos quêtes de guilde. Bonne chance ! ❤️");
    })
});

client.on(Events.GuildMemberAdd, async (member) => {
    await setUserRole(member, { name: NEW_JOINER_ROLE });
})

const interactionCommands = {
    "rename": renameUser,
    "button": createButton,
    "set-role": setRole,
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isModalSubmit()) {
        if (interaction.customId === "presentationModal") {
            const inGameName = interaction.fields.getTextInputValue("inGameName");
            const userPresentation = interaction.fields.getTextInputValue("userPresentation");
            const inGameJobs = interaction.fields.getTextInputValue("inGameJobs");
            const member = interaction.member as GuildMember;

            await interaction.deferReply({ ephemeral: true });

            try {
                await member.setNickname(inGameName);
                await setUserRole(member, { name: NEW_JOINER_ROLE });
                await setUserRole(member, { name: TEMPORARY_ROLE });
                const welcomeChannel = interaction.guild?.channels.cache.find(c => c.name.toLowerCase() === WELCOME_CHANNEL) as TextChannel | undefined;
                await welcomeChannel?.send(`@everyone, nous accueillons **${inGameName}** dans la guilde !! \n **Présentation:** ${userPresentation}`);

                const jobsChannel = interaction.guild?.channels.cache.find(c => c.name.toLowerCase() === JOBS_CHANNEL) as TextChannel | undefined;
                await jobsChannel?.send(`**${inGameName}** a déclaré ses métiers : ${inGameJobs}`);

                const roleChannel = interaction.guild?.channels.cache.find(c => c.name.toLowerCase() === ROLE_ATTRIBUTION_CHANNEL) as TextChannel | undefined;
                const availableRoles = interaction.guild?.roles.cache
                    .filter(r => !ROLE_SELECT_EXCLUDED.includes(r.name))
                    .map(r => ({ label: r.name, value: r.id })) ?? [];
                const roleSelect = new StringSelectMenuBuilder()
                    .setCustomId(`assign-role-${member.id}`)
                    .setPlaceholder("Attribuer un rôle au nouveau membre")
                    .setMinValues(1)
                    .setMaxValues(availableRoles.length)
                    .addOptions(availableRoles);
                const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleSelect);
                await roleChannel?.send({
                    content: `@everyone, nouveau membre à accueillir : **${inGameName}**`,
                    components: [row],
                });

                await interaction.editReply({ content: "Présentation enregistrée avec succès" });
            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: "Une erreur est survenue lors de l'enregistrement de la présentation" });
            }
        }
    }
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("assign-role-")) {
        const executor = interaction.member as GuildMember;
        const hasPermission = executor.roles.cache.some(r => SET_ROLE_ALLOWED.includes(r.name));

        if (!hasPermission) {
            return interaction.reply({ content: "Vous n'avez pas la permission d'attribuer un rôle", ephemeral: true });
        }

        const targetMemberId = interaction.customId.replace("assign-role-", "");
        const targetMember = await interaction.guild?.members.fetch(targetMemberId);

        if (!targetMember || interaction.values.length === 0) {
            return interaction.reply({ content: "Membre ou rôle introuvable", ephemeral: true });
        }

        try {
            const rolesToRemove = targetMember.guild.roles.cache.filter(r => r.name === NEW_JOINER_ROLE || r.name === TEMPORARY_ROLE);
            if (rolesToRemove.size > 0) await targetMember.roles.remove(rolesToRemove.map(r => r.id));
            await targetMember.roles.add(interaction.values);
            const roleNames = interaction.values
                .map(id => interaction.guild?.roles.cache.get(id)?.name)
                .map(name => `**${name}**`)
                .join(", ");
            await interaction.message.edit({ components: [] });
            return interaction.reply({ content: `Rôles ${roleNames} attribués à **${targetMember.displayName}**`, ephemeral: true });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "Une erreur est survenue lors de l'attribution du rôle", ephemeral: true });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === "confirm") {
            const modal = new ModalBuilder().setCustomId("presentationModal").setTitle("Présentez-vous");
            const inGameInput = new TextInputBuilder().setCustomId("inGameName").setStyle(TextInputStyle.Short).setPlaceholder("Pseudo dofus");
            const inGameLabel = new LabelBuilder().setLabel("Quel est votre pseudo dofus ?").setTextInputComponent(inGameInput);
            const PresentationInput = new TextInputBuilder().setCustomId("userPresentation").setStyle(TextInputStyle.Paragraph).setPlaceholder("Durée de jeu, classe, métiers, préférences, etc.")
            const PresensationLabel = new LabelBuilder().setLabel("Présentez-vous").setTextInputComponent(PresentationInput);
            const inGameJobsInput = new TextInputBuilder().setCustomId("inGameJobs").setStyle(TextInputStyle.Paragraph).setPlaceholder("Aucun, Bijoutier, cordonnier, cordomage, etc.");
            const inGameJobsLabel = new LabelBuilder().setLabel("Quels sont vos métiers ?").setTextInputComponent(inGameJobsInput);

            modal.addLabelComponents(inGameLabel, PresensationLabel, inGameJobsLabel);

            await interaction.showModal(modal);   
        }
    }

    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = interactionCommands[interaction.commandName as keyof typeof interactionCommands];
    if (!command) {
        return;
    }

    await command(interaction);
})



client.login(config.DISCORD_PRIVATE_TOKEN);