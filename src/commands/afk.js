const {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require("discord.js");

const afkMap = global.afk ?? (global.afk = new Map());

const afkCommand = new SlashCommandBuilder()
  .setName("afk")
  .setDescription("Descanse um pouquinho!")
  .addStringOption((opcao) =>
    opcao
      .setName("motivo")
      .setDescription("Motivo da sua ausência.")
      .setRequired(false),
  );

function motivoOuPadrao(motivo) {
  const motivoNormalizado = motivo?.trim();
  return motivoNormalizado || "Não sei :(";
}

function podeGerenciarApelidos(botMember) {
  return Boolean(
    botMember?.permissions?.has(PermissionFlagsBits.ManageNicknames),
  );
}

function nomeOriginal(member, user, registroAnterior) {
  const nomeSalvo =
    registroAnterior?.oldName ??
    registroAnterior?.oldNickname ??
    member?.displayName ??
    member?.user?.username ??
    user.username;

  return String(nomeSalvo).replace("[AFK] ", "").trim() || user.username;
}

function ehDonoOuMembroAcimaDoBot(member) {
  const guildOwnerId = member?.guild?.ownerId;
  const memberId = member?.id ?? member?.user?.id;

  return (
    memberId === guildOwnerId ||
    member?.manageable === false
  );
}

async function tentarDefinirApelido(member, botMember, apelido) {
  if (!member) {
    return {
      aviso:
        "Não consegui mudar seu apelido porque não encontrei seu membro no servidor.",
    };
  }

  if (!podeGerenciarApelidos(botMember)) {
    console.log(
      "ERRO NICK: o bot não tem a permissão ManageNicknames (Gerenciar apelidos).",
    );
    return {
      aviso:
        "Não consegui mudar seu apelido porque não tenho a permissão Gerenciar apelidos.",
    };
  }

  if (ehDonoOuMembroAcimaDoBot(member)) {
    console.log(
      "ERRO NICK: o cargo do Granoleiro precisa estar acima do membro. O dono do servidor também não pode ter o apelido alterado pelo bot.",
    );
  }

  console.log(`Tentando mudar apelido de ${apelido}`);
  try {
    await member.setNickname(apelido);
    return { aviso: null };
  } catch (erro) {
    console.log("ERRO NICK:", erro.message);
    return {
      aviso:
        "Não consegui mudar seu apelido porque meu cargo está abaixo do seu",
    };
  }
}

async function executarAfk({
  user,
  member,
  botMember,
  motivo,
  responder,
}) {
  const registroAnterior = afkMap.get(user.id);
  const oldName = nomeOriginal(member, user, registroAnterior);
  const newName = `[AFK] ${oldName}`.slice(0, 32);
  const registro = {
    userId: user.id,
    motivo: motivoOuPadrao(motivo),
    timestamp: Date.now(),
    oldName,
    oldNickname: oldName,
  };

  afkMap.set(user.id, registro);

  const resultadoApelido = await tentarDefinirApelido(
    member,
    botMember,
    newName,
  );
  const avisoApelido = resultadoApelido.aviso
    ? `\n\n${resultadoApelido.aviso}`
    : "";

  await responder({
    embeds: [
      new EmbedBuilder()
        .setColor("#32CD32")
        .setThumbnail(user.displayAvatarURL())
        .setDescription(
          `Pronto! Agora você está afk e pode descansar sem ficarem te chamando pra jogar :O\n\nMotivo: "${registro.motivo}"${avisoApelido}`,
        ),
    ],
  });
}

async function removerAfk({ user, member, botMember }) {
  const registro = afkMap.get(user.id);
  if (!registro) return false;

  afkMap.delete(user.id);

  if (member && podeGerenciarApelidos(botMember)) {
    try {
      await member.setNickname(registro.oldName ?? registro.oldNickname);
    } catch (erro) {
      console.log("ERRO NICK AO RESTAURAR:", erro.message);
    }
  }

  return true;
}

function criarEmbedDeMencao(registro) {
  return new EmbedBuilder()
    .setColor("#808080")
    .setDescription(`Motivo: ${registro.motivo}`);
}

module.exports = {
  afkCommand,
  afkMap,
  executarAfk,
  removerAfk,
  criarEmbedDeMencao,
};