const { Client, EmbedBuilder, GatewayIntentBits } = require("discord.js");

const GIF_FALLBACK =
  "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif";

const comandos = {
  tapa: {
    api: "slap",
    resposta: (autor, usuario) => `${autor} deu um tapa em ${usuario} 👊`,
  },
  beijo: {
    api: "kiss",
    resposta: (autor, usuario) => `${autor} beijou ${usuario} 😘`,
  },
  abraco: {
    api: "hug",
    resposta: (autor, usuario) => `${autor} abraçou ${usuario} 🤗`,
  },
  cafune: {
    api: "pat",
    resposta: (autor, usuario) => `${autor} fez cafuné em ${usuario} 🥰`,
  },
  morder: {
    api: "bite",
    resposta: (autor, usuario) => `${autor} mordeu ${usuario} 😬`,
  },
  cutucar: {
    api: "poke",
    resposta: (autor, usuario) => `${autor} cutucou ${usuario} 👉`,
  },
  lamber: {
    api: "lick",
    resposta: (autor, usuario) => `${autor} lambeu ${usuario} 😋`,
  },
  chutar: {
    api: "kick",
    resposta: (autor, usuario) => `${autor} chutou ${usuario} 🦶`,
  },
  bravo: {
    api: "angry",
    resposta: (autor, usuario) => `${autor} ficou bravo com ${usuario} 😠`,
  },
  chorar: {
    api: "cry",
    resposta: (autor, usuario) => `${autor} chorou por causa de ${usuario} 😭`,
  },
  dancar: {
    api: "dance",
    resposta: (autor, usuario) => `${autor} dançou com ${usuario} 💃`,
  },
  rir: {
    api: "laugh",
    resposta: (autor, usuario) => `${autor} riu de ${usuario} 😂`,
  },
  corar: {
    api: "blush",
    resposta: (autor, usuario) => `${autor} corou para ${usuario} 😊`,
  },
  vergonha: {
    api: "facepalm",
    resposta: (autor, usuario) => `${autor} ficou com vergonha por causa de ${usuario} 🤦`,
  },
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", (bot) => {
  console.log(`Bot conectado como ${bot.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const comando = comandos[interaction.commandName];
  if (!comando) return;

  const usuario = interaction.options.getUser("usuario", true);
  const mensagem = comando.resposta(interaction.user, usuario);

  await interaction.deferReply();

  let gifUrl = GIF_FALLBACK;

  try {
    const resposta = await fetch(
      `https://nekos.best/api/v2/${comando.api}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "DiscordGifBot/1.0",
        },
      },
    );

    if (!resposta.ok) {
      throw new Error(`A API retornou HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();
    const url = dados?.results?.[0]?.url;

    if (typeof url !== "string" || !url) {
      throw new Error("A API não retornou uma URL de GIF válida");
    }

    gifUrl = url;
  } catch (erro) {
    console.error(`Erro ao buscar GIF para /${interaction.commandName}:`, erro);
  }

  const embed = new EmbedBuilder().setImage(gifUrl);
  await interaction.editReply({
    content: mensagem,
    embeds: [embed],
  });
});

const token = process.env.TOKEN;
if (!token) {
  throw new Error("A variável de ambiente TOKEN é obrigatória.");
}

client.login(token);