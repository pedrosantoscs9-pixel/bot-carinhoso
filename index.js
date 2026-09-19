global.afk = new Map();

const {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
} = require("discord.js");
const {
  afkCommand,
  executarAfk,
} = require("./src/commands/afk");

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

const aliases = {
  tapa: "tapa",
  tapar: "tapa",
  beijo: "beijo",
  beijar: "beijo",
  beijou: "beijo",
  abraco: "abraco",
  abraçar: "abraco",
  abracar: "abraco",
  abraço: "abraco",
  cafune: "cafune",
  cafuné: "cafune",
  morder: "morder",
  morde: "morder",
  cutucar: "cutucar",
  cutuca: "cutucar",
  lamber: "lamber",
  lambe: "lamber",
  chutar: "chutar",
  chuta: "chutar",
  bravo: "bravo",
  brigar: "bravo",
  chorar: "chorar",
  chora: "chorar",
  dancar: "dancar",
  dançar: "dancar",
  dança: "dancar",
  rir: "rir",
  ri: "rir",
  corar: "corar",
  cora: "corar",
  vergonha: "vergonha",
  envergonhar: "vergonha",
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", (bot) => {
  console.log(`Bot conectado como ${bot.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === afkCommand.name) {
    await executarAfk({
      user: interaction.user,
      member: interaction.member,
      botMember: interaction.guild?.members.me,
      motivo: interaction.options.getString("motivo"),
      responder: (resposta) => interaction.reply(resposta),
    });
    return;
  }

  const comando = comandos[interaction.commandName];
  if (!comando) return;

  const usuario = interaction.options.getUser("usuario", true);

  await interaction.deferReply();

  await executarComando(
    comando,
    interaction.user,
    usuario,
    (resposta) => interaction.editReply(resposta),
  );
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const conteudo = message.content.trim();
  const comandoAfk = conteudo.match(/^gra\s+afk(?:\s|$)/i);
  const prefixo = conteudo.match(/^gra\s+/i);
  const argumentos = prefixo
    ? conteudo.slice(prefixo[0].length).trim()
    : "";

  if (comandoAfk) {
    const oldName = message.member?.displayName ?? message.author.username;
    const nomeSemAfk = oldName.replace(/^\[AFK\]\s*/i, "");
    const motivo = conteudo.slice(comandoAfk[0].length).trim() || "Não sei :(";
    const botMember = message.guild?.members.me;

    global.afk.set(message.author.id, {
      oldName,
      motivo,
    });

    if (
      message.member?.setNickname &&
      botMember?.permissions?.has(PermissionFlagsBits.ManageNicknames)
    ) {
      try {
        await message.member.setNickname(`[AFK] ${nomeSemAfk}`.slice(0, 32));
      } catch (erro) {
        console.log("ERRO NICK:", erro.message);
      }
    } else {
      console.log(
        "ERRO NICK: o bot precisa da permissão ManageNicknames e de um cargo acima do membro.",
      );
    }

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#32CD32")
          .setThumbnail(message.author.displayAvatarURL())
          .setDescription(
            `Pronto! Agora você está afk e pode descansar sem ficarem te chamando pra jogar :O\n\nMotivo: ${motivo}`,
          ),
      ],
    });
    return;
  }

  const registroDoAutor = global.afk.get(message.author.id);
  if (registroDoAutor) {
    global.afk.delete(message.author.id);

    if (message.member?.setNickname) {
      try {
        await message.member.setNickname(registroDoAutor.oldName);
      } catch (erro) {
        console.log("ERRO NICK AO RESTAURAR:", erro.message);
      }
    }

    await message.channel.send({
      content: `${message.author}\nAgora você está de volta! Senti saudades de você :p`,
    });
  }

  const usuarioMencionado = [
    ...message.mentions.users.values(),
    ...(message.mentions.repliedUser ? [message.mentions.repliedUser] : []),
  ].find((usuario) => global.afk.has(usuario.id));

  if (usuarioMencionado) {
    await message.channel.send({
      content:
        "o usuário que você marcou está AFK, não perturbe ele até ele voltar! Hmph!",
    });
  }

  if (!prefixo) return;

  const partes = argumentos.split(/\s+/);
  const nomeInformado = partes[0]?.toLocaleLowerCase("pt-BR");
  const nomeComando = aliases[nomeInformado];
  const comando = comandos[nomeComando];
  const usuario = message.mentions.users.first();

  if (!comando || !usuario) return;

  await executarComando(
    comando,
    message.author,
    usuario,
    (resposta) => message.reply(resposta),
  );
});

async function executarComando(comando, autor, usuario, responder) {
  const mensagem = comando.resposta(autor, usuario);
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
    console.error("Erro ao buscar GIF:", erro);
  }

  const embed = new EmbedBuilder().setImage(gifUrl);
  await responder({
    content: mensagem,
    embeds: [embed],
  });
}

const token = process.env.TOKEN;
if (!token) {
  throw new Error("A variável de ambiente TOKEN é obrigatória.");
}

client.login(token);