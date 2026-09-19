const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { afkCommand } = require("./src/commands/afk");

const comandos = [
  ["tapa", "Dê um tapa em um usuário."],
  ["beijo", "Dê um beijo em um usuário."],
  ["abraco", "Dê um abraço em um usuário."],
  ["cafune", "Faça cafuné em um usuário."],
  ["morder", "Morda um usuário."],
  ["cutucar", "Cutucar um usuário."],
  ["lamber", "Lamba um usuário."],
  ["chutar", "Chute um usuário."],
  ["bravo", "Fique bravo com um usuário."],
  ["chorar", "Chore por causa de um usuário."],
  ["dancar", "Dance com um usuário."],
  ["rir", "Ria de um usuário."],
  ["corar", "Fique corado para um usuário."],
  ["vergonha", "Fique com vergonha por causa de um usuário."],
].map(([nome, descricao]) =>
  new SlashCommandBuilder()
    .setName(nome)
    .setDescription(descricao)
    .addUserOption((opcao) =>
      opcao
        .setName("usuario")
        .setDescription("Usuário que participará da interação.")
        .setRequired(true),
    )
    .toJSON(),
);

comandos.push(afkCommand.toJSON());

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token) {
  throw new Error("A variável de ambiente TOKEN é obrigatória.");
}

if (!clientId) {
  throw new Error(
    "A variável de ambiente CLIENT_ID é obrigatória para registrar os comandos.",
  );
}

const rest = new REST({ version: "10" }).setToken(token);

async function registrarComandos() {
  console.log(`Registrando ${comandos.length} comandos slash...`);

  await rest.put(Routes.applicationCommands(clientId), {
    body: comandos,
  });

  console.log("Todos os comandos foram registrados com sucesso.");
}

registrarComandos().catch((erro) => {
  console.error("Não foi possível registrar os comandos:", erro);
  process.exitCode = 1;
});