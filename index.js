const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot Carinhoso ON'));
app.listen(process.env.PORT || 3000, () => console.log('Site fake on'));
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  MessageFlags,
} = require("discord.js");

const GIF_FALLBACK =
  "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif";

const comandos = {
  tapa: {
    api: "slap",
    resposta: (autor, usuario) => `${autor} deu um tapa em ${usuario} 👊`,
    retorno: {
      label: "Dar um tapa de volta",
      emoji: "👊",
      frase: "se deram tapas",
    },
  },
  beijo: {
    api: "kiss",
    resposta: (autor, usuario) => `${autor} beijou ${usuario} 😍`,
    retorno: {
      label: "Beijar de volta",
      emoji: "😍",
      frase: "se beijaram",
    },
  },
  abraco: {
    api: "hug",
    resposta: (autor, usuario) => `${autor} abraçou ${usuario} 🤗`,
    retorno: {
      label: "Abraçar de volta",
      emoji: "🤗",
      frase: "se abraçaram",
    },
  },
  cafune: {
    api: "pat",
    resposta: (autor, usuario) => `${autor} fez cafuné em ${usuario} 🥰`,
  },
  morder: {
    api: "bite",
    resposta: (autor, usuario) => `${autor} mordeu ${usuario} 😬`,
    retorno: {
      label: "Morder de volta",
      emoji: "😬",
      frase: "se morderam",
    },
  },
  cutucar: {
    api: "poke",
    resposta: (autor, usuario) => `${autor} cutucou ${usuario} 👉`,
    retorno: {
      label: "Cutucar de volta",
      emoji: "👉",
      frase: "se cutucaram",
    },
  },
  lamber: {
    api: "lick",
    resposta: (autor, usuario) => `${autor} lambeu ${usuario} 😋`,
    retorno: {
      label: "Lamber de volta",
      emoji: "😋",
      frase: "se lamberam",
    },
  },
  chutar: {
    api: "kick",
    resposta: (autor, usuario) => `${autor} chutou ${usuario} 🦶`,
    retorno: {
      label: "Chutar de volta",
      emoji: "🦶",
      frase: "se chutaram",
    },
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

const contadoresInteracoes = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", (bot) => {
  console.log(`Bot conectado como ${bot.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    try {
      await lidarComRetorno(interaction);
    } catch (erro) {
      console.error("Erro ao processar botão:", erro);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Não consegui processar esse botão agora.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const comando = comandos[interaction.commandName];
  if (!comando) return;

  const usuario = interaction.options.getUser("usuario", true);

  await interaction.deferReply();

  await executarComando(
    interaction.commandName,
    comando,
    interaction.user,
    usuario,
    (resposta) => interaction.editReply(resposta),
    interaction.member,
    interaction.options.getMember("usuario"),
  );
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const conteudo = message.content.trim();
  const prefixo = conteudo.match(/^gra(?:\s+|$)/i);
  if (!prefixo) return;

  const argumentos = conteudo.slice(prefixo[0].length).trim();
  const partes = argumentos.split(/\s+/).filter(Boolean);
  const nomeInformado = partes.shift()?.toLocaleLowerCase("pt-BR");
  const nomeComando = aliases[nomeInformado];
  const comando = comandos[nomeComando];
  const usuario = message.mentions.users.first();
  const usuarioMembro = message.mentions.members.first();

  if (!comando || !usuario) return;

  await executarComando(
    nomeComando,
    comando,
    message.author,
    usuario,
    (resposta) => message.reply(resposta),
    message.member,
    usuarioMembro,
  );
});

function nomeExibicao(usuario, membro) {
  return (
    membro?.displayName ??
    usuario?.globalName ??
    usuario?.username ??
    "usuário"
  );
}

async function executarComando(
  nomeComando,
  comando,
  autor,
  usuario,
  responder,
  autorMembro,
  usuarioMembro,
) {
  const mensagem = comando.resposta(
    nomeExibicao(autor, autorMembro),
    nomeExibicao(usuario, usuarioMembro),
  );
  const gifUrl = await buscarGif(comando);

  const embed = new EmbedBuilder().setImage(gifUrl);
  const resposta = {
    content: mensagem,
    embeds: [embed],
    allowedMentions: { parse: [] },
  };

  if (comando.retorno) {
    resposta.components = [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(
            `retorno:${nomeComando}:${autor.id}:${usuario.id}`,
          )
          .setLabel(comando.retorno.label)
          .setEmoji(comando.retorno.emoji)
          .setStyle(ButtonStyle.Secondary),
      ),
    ];
  }

  await responder(resposta);
}

async function buscarGif(comando) {
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

    return url;
  } catch (erro) {
    console.error("Erro ao buscar GIF:", erro);
    return GIF_FALLBACK;
  }
}

async function lidarComRetorno(interaction) {
  const partes = interaction.customId.split(":");
  const [tipo, nomeComando, autorId, alvoId] = partes;

  if (tipo !== "retorno" || partes.length !== 4) return;

  const mentions = interaction.message?.mentions;
  const alvoUsuario =
    mentions?.users?.get?.(alvoId) ??
    client.users.cache.get(alvoId);
  const alvoMembro =
    mentions?.members?.get?.(alvoId) ??
    interaction.guild?.members.cache.get(alvoId);
  const alvoNome = nomeExibicao(alvoUsuario, alvoMembro);

  if (interaction.user.id !== alvoId) {
    await interaction.reply({
      content: `Eii! Você não é ${alvoNome}, saia daqui! 😡`,
      allowedMentions: { parse: [] },
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const comando = comandos[nomeComando];
  if (!comando?.retorno) return;

  const ids = [autorId, alvoId].sort();
  const chave = `${nomeComando}:${ids[0]}:${ids[1]}`;
  const quantidade = (contadoresInteracoes.get(chave) ?? 0) + 1;
  contadoresInteracoes.set(chave, quantidade);

  const autor = client.users.cache.get(autorId);
  const autorMembro = interaction.guild?.members.cache.get(autorId);
  const autorNome = nomeExibicao(autor, autorMembro);
  const vezes = quantidade === 1 ? "vez" : "vezes";
  const textoContador =
    `\n-# ${autorNome} e ${alvoNome} ${comando.retorno.frase} ` +
    `${quantidade} ${vezes}`;
  const gifUrl = await buscarGif(comando);

  await interaction.reply({
    content: `${comando.resposta(alvoNome, autorNome)}${textoContador}`,
    embeds: [new EmbedBuilder().setImage(gifUrl)],
    allowedMentions: { parse: [] },
  });
}

const token = process.env.TOKEN;
if (!token) {
  throw new Error("A variável de ambiente TOKEN é obrigatória.");
}

client.login(token);
