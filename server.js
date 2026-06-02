const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════════
//  BANCOS DE PALAVRAS POR TEMA
// ═══════════════════════════════════════════════

const TEMAS = {
  adverbiais: {
    nome: 'Conjunções Adverbiais',
    palavras: [
      { palavra: 'PORQUE',       tipo: 'Causal',        dica: 'Indica a causa ou motivo da ação principal' },
      { palavra: 'JA-QUE',      tipo: 'Causal',        dica: 'Equivale a "porque"; causa já conhecida pelo interlocutor' },
      { palavra: 'VISTO-QUE',   tipo: 'Causal',        dica: 'Em vista de que; introduz causa de forma mais formal' },
      { palavra: 'PORQUANTO',    tipo: 'Causal',        dica: 'Forma erudita de "porque"; pouco usada na oralidade' },
      { palavra: 'POIS-QUE',    tipo: 'Causal',        dica: 'Introduz explicação ou causa (registro formal)' },
      { palavra: 'COMO',         tipo: 'Comparativa',   dica: 'Estabelece comparação ou conformidade entre termos' },
      { palavra: 'ASSIM-COMO',  tipo: 'Comparativa',   dica: 'Compara dois elementos em situação de igualdade' },
      { palavra: 'TAL-COMO',    tipo: 'Comparativa',   dica: 'Exatamente como; comparação de modo ou maneira' },
      { palavra: 'DO-QUE',      tipo: 'Comparativa',   dica: 'Usada após "mais" ou "menos" em comparações' },
      { palavra: 'TAL-QUAL',    tipo: 'Comparativa',   dica: 'Exatamente igual; comparação de perfeita igualdade' },
      { palavra: 'QUE-NEM',     tipo: 'Comparativa',   dica: 'Popular; equivale a "assim como"' },
      { palavra: 'EMBORA',       tipo: 'Concessiva',    dica: 'Indica fato que contraria o esperado, mas não impede a ação' },
      { palavra: 'AINDA-QUE',   tipo: 'Concessiva',    dica: 'Mesmo que; introduz concessão hipotética ou real' },
      { palavra: 'MESMO-QUE',   tipo: 'Mesmo-QUE',    dica: 'Ainda que; reforça a concessão mesmo diante de obstáculo' },
      { palavra: 'CONQUANTO',    tipo: 'Concessiva',    dica: 'Equivale a "embora"; uso mais formal e literário' },
      { palavra: 'POSTO-QUE',   tipo: 'Concessiva',    dica: 'Embora; apesar de que (uso concessivo formal)' },
      { palavra: 'CASO',         tipo: 'Condicional',   dica: 'Introduz hipótese ou condição para a oração principal' },
      { palavra: 'DESDE-QUE',   tipo: 'Condicional',   dica: 'Contanto que; estabelece condição necessária' },
      { palavra: 'SALVO-SE',    tipo: 'Condicional',   dica: 'Exceto se; introduz condição de exceção' },
      { palavra: 'DADO-QUE',    tipo: 'Condicional',   dica: 'Condição pressuposta como verdadeira ou admitida' },
      { palavra: 'CONFORME',     tipo: 'Conformativa',  dica: 'De acordo com; indica adequação ou conformidade' },
      { palavra: 'SEGUNDO',      tipo: 'Conformativa',  dica: 'De acordo com o que foi dito ou estabelecido' },
      { palavra: 'CONSOANTE',    tipo: 'Conformativa',  dica: 'Em conformidade com; equivale a "conforme" (formal)' },
      { palavra: 'DE-MODO-QUE',  tipo: 'Consecutiva',   dica: 'Indica a consequência natural da ação principal' },
      { palavra: 'DE-FORMA-QUE', tipo: 'Consecutiva',   dica: 'De maneira que; introduz resultado ou efeito' },
      { palavra: 'PARA-QUE',    tipo: 'Final',         dica: 'Indica o objetivo ou finalidade da ação principal' },
      { palavra: 'AO-PASSO-QUE',tipo: 'Proporcional',  dica: 'Indica proporção simultânea entre duas ações' },
      { palavra: 'QUANDO',       tipo: 'Temporal',      dica: 'Indica o momento exato em que ocorre a ação' },
      { palavra: 'ASSIM-QUE',   tipo: 'Temporal',      dica: 'Logo que; ação ocorre imediatamente após outra' },
      { palavra: 'LOGO-QUE',    tipo: 'Temporal',      dica: 'Assim que; expressa sequência temporal imediata' },
      { palavra: 'ANTES-QUE',   tipo: 'Temporal',      dica: 'Indica anterioridade em relação à ação principal' },
      { palavra: 'ATE-QUE',     tipo: 'Temporal',      dica: 'Indica o limite temporal até onde a ação se estende' },
      { palavra: 'SEMPRE-QUE',  tipo: 'Temporal',      dica: 'Toda vez que; indica repetição ou hábito temporal' },
    ],
  },

  coordenadas: {
    nome: 'Conjunções Coordenadas',
    palavras: [
      { palavra: 'NEM',         tipo: 'Aditiva',      dica: 'Aditiva negativa; equivale a "e não" ou "também não"' },
      { palavra: 'BEM-COMO',   tipo: 'Aditiva',      dica: 'Indica adição com valor de "e também" (formal)' },
      { palavra: 'MAS',         tipo: 'Adversativa',  dica: 'Indica oposição ou contraste entre orações coordenadas' },
      { palavra: 'POREM',       tipo: 'Adversativa',  dica: 'Equivale a "mas"; indica adversidade ou ressalva' },
      { palavra: 'CONTUDO',     tipo: 'Adversativa',  dica: 'No entanto; indica contraste ou restrição' },
      { palavra: 'TODAVIA',     tipo: 'Adversativa',  dica: 'Porém; apesar disso; adversidade mais formal' },
      { palavra: 'ENTRETANTO',  tipo: 'Adversativa',  dica: 'No entanto; enquanto isso; indica oposição' },
      { palavra: 'NO-ENTANTO',  tipo: 'Adversativa',  dica: 'Todavia; porém; indica contraste com o anterior' },
      { palavra: 'ORA',         tipo: 'Alternativa',  dica: 'Usada em par (ora...ora) para indicar alternância' },
      { palavra: 'LOGO',        tipo: 'Conclusiva',   dica: 'Portanto; por isso; tira conclusão da oração anterior' },
      { palavra: 'PORTANTO',    tipo: 'Conclusiva',   dica: 'Logo; por isso; conclui ou resume a ideia anterior' },
      { palavra: 'ASSIM',       tipo: 'Conclusiva',   dica: 'Dessa forma; por isso; expressa conclusão lógica' },
      { palavra: 'POR-ISSO',   tipo: 'Conclusiva',   dica: 'Por essa razão; indica conclusão ou consequência direta' },
      { palavra: 'POIS',        tipo: 'Explicativa',  dica: 'Antes do verbo: explica ou justifica a oração anterior' },
      { palavra: 'QUE',         tipo: 'Explicativa',  dica: 'Porque; introduz explicação (não faças isso, que é tarde)' },
    ],
  },

  outras: {
    nome: 'Outras Regras Gramaticais',
    palavras: [
      { palavra: 'SUJEITO',     tipo: 'Sintaxe',      dica: 'Termo que pratica, sofre ou sobre o qual se declara algo' },
      { palavra: 'PREDICADO',   tipo: 'Sintaxe',      dica: 'Tudo o que se declara sobre o sujeito na oração' },
      { palavra: 'APOSTO',      tipo: 'Sintaxe',      dica: 'Termo que explica, resume ou especifica outro termo' },
      { palavra: 'VOCATIVO',    tipo: 'Sintaxe',      dica: 'Chama ou interpela alguém; isolado por vírgulas' },
      { palavra: 'ADJUNTO',     tipo: 'Sintaxe',      dica: 'Modifica nome (adnominal) ou verbo (adverbial)' },
      { palavra: 'PERIODO',     tipo: 'Sintaxe',      dica: 'Frase organizada em torno de uma ou mais orações' },
      { palavra: 'ORACAO',      tipo: 'Sintaxe',      dica: 'Unidade sintática construída em torno de um verbo' },
      { palavra: 'SUBSTANTIVO', tipo: 'Morfologia',   dica: 'Classe que nomeia seres, objetos, lugares e sentimentos' },
      { palavra: 'ADJETIVO',    tipo: 'Morfologia',   dica: 'Palavra que caracteriza ou qualifica o substantivo' },
      { palavra: 'PRONOME',     tipo: 'Morfologia',   dica: 'Substitui ou acompanha o substantivo na oração' },
      { palavra: 'ARTIGO',      tipo: 'Morfologia',   dica: 'Determina o substantivo (o, a, um, uma)' },
      { palavra: 'NUMERAL',     tipo: 'Morfologia',   dica: 'Indica quantidade, ordem, fração ou multiplicação' },
      { palavra: 'VERBO',       tipo: 'Morfologia',   dica: 'Indica ação, estado, fenômeno ou processo' },
      { palavra: 'ADVERBIO',    tipo: 'Morfologia',   dica: 'Modifica verbo, adjetivo ou outro advérbio' },
      { palavra: 'PREPOSICAO',  tipo: 'Morfologia',   dica: 'Liga termos indicando relação entre eles (de, em, por...)' },
      { palavra: 'INTERJEICAO', tipo: 'Morfologia',   dica: 'Exprime emoção ou sentimento de forma exclamativa' },
      { palavra: 'MORFEMA',     tipo: 'Morfologia',   dica: 'Menor unidade significativa da língua' },
      { palavra: 'FONEMA',      tipo: 'Fonologia',    dica: 'Menor unidade sonora capaz de distinguir significados' },
      { palavra: 'SILABA',      tipo: 'Fonologia',    dica: 'Unidade fonológica formada em torno de uma vogal' },
      { palavra: 'DITONGO',     tipo: 'Fonologia',    dica: 'Vogal + semivogal (ou vice-versa) na mesma sílaba' },
      { palavra: 'TRITONGO',    tipo: 'Fonologia',    dica: 'Semivogal + vogal + semivogal na mesma sílaba' },
      { palavra: 'HIATO',       tipo: 'Fonologia',    dica: 'Duas vogais em sequência que pertencem a sílabas diferentes' },
      { palavra: 'CRASE',       tipo: 'Ortografia',   dica: 'Fusão da preposição "a" com artigo "a" (representada por à)' },
      { palavra: 'PARAGOGE',    tipo: 'Fonologia',    dica: 'Acréscimo de fonema ao final de uma palavra' },
      { palavra: 'METAPLASMO',  tipo: 'Fonologia',    dica: 'Alteração na estrutura fonética de uma palavra' },
    ],
  },
};

// ═══════════════════════════════════════════════
//  VALIDAÇÃO COM DICIONÁRIO PORTUGUÊS
// ═══════════════════════════════════════════════

const cachePortugues = new Map(); // palavra normalizada → boolean

async function existeNoPortugues(palavra) {
  if (cachePortugues.has(palavra)) return cachePortugues.get(palavra);
  try {
    const res = await fetch(`https://api.dicionario-aberto.net/word/${palavra.toLowerCase()}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) {
      cachePortugues.set(palavra, false);
      return false;
    }
    const data = await res.json();
    const existe = Array.isArray(data) && data.length > 0;
    cachePortugues.set(palavra, existe);
    return existe;
  } catch {
    // Em caso de falha de rede, permite a tentativa (não bloqueia o jogo)
    return true;
  }
}

// ═══════════════════════════════════════════════
//  ÍNDICE DE PALAVRAS VÁLIDAS (por nº de letras)
// ═══════════════════════════════════════════════

const PALAVRAS_VALIDAS = {};
Object.values(TEMAS).forEach(({ palavras }) => {
  palavras.forEach(({ palavra }) => {
    const norm = soLetras(palavra).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!PALAVRAS_VALIDAS[norm.length]) PALAVRAS_VALIDAS[norm.length] = new Set();
    PALAVRAS_VALIDAS[norm.length].add(norm);
  });
});

// ═══════════════════════════════════════════════
//  ESTADO DO SERVIDOR
// ═══════════════════════════════════════════════

const salas = {};

function gerarCodigo() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function posHifens(palavra) {
  return palavra.split('').reduce((a, c, i) => { if (c === '-') a.push(i); return a; }, []);
}

function soLetras(palavra) { return palavra.replace(/-/g, ''); }

function infoSalasAbertas() {
  return Object.entries(salas)
    .filter(([, s]) => !s.emJogo)
    .map(([codigo, s]) => ({
      codigo,
      host: s.jogadores[0]?.nome || '?',
      jogadores: s.jogadores.length,
      tema: TEMAS[s.tema]?.nome || s.tema,
      temaKey: s.tema,
    }));
}

function emitirListaSalas() {
  io.emit('listaSalas', infoSalasAbertas());
}

function checarPalavra(tentativa, resposta) {
  const respLetras = soLetras(resposta).split('');
  const n = resposta.length;
  const hifens = posHifens(resposta);
  const resultado = new Array(n).fill('absent');

  hifens.forEach(i => { resultado[i] = 'hyphen'; });

  const idxLetras = resposta.split('').reduce((a, c, i) => { if (c !== '-') a.push(i); return a; }, []);
  const usado = new Array(respLetras.length).fill(false);

  idxLetras.forEach((origIdx, li) => {
    if (tentativa[li] === respLetras[li]) {
      resultado[origIdx] = 'correct';
      usado[li] = true;
    }
  });

  idxLetras.forEach((origIdx, li) => {
    if (resultado[origIdx] !== 'absent') return;
    for (let j = 0; j < respLetras.length; j++) {
      if (!usado[j] && tentativa[li] === respLetras[j]) {
        resultado[origIdx] = 'present';
        usado[j] = true;
        break;
      }
    }
  });

  return resultado;
}

function iniciarRodada(codigo) {
  const sala = salas[codigo];
  const rodada = sala.palavras[sala.rodadaAtual];
  sala.estadoRodada = {};

  const nLetras = soLetras(rodada.palavra).length;
  const maxTentativas = nLetras;

  sala.jogadores.forEach(j => {
    sala.estadoRodada[j.id] = { tentativas: [], maxTentativas, acertou: false, acabou: false };
  });

  io.to(codigo).emit('novaRodada', {
    rodada: sala.rodadaAtual + 1,
    totalRodadas: sala.palavras.length,
    tamanho: rodada.palavra.length,
    nLetras,
    hifens: posHifens(rodada.palavra),
    tipo: rodada.tipo,
    dica: rodada.dica,
    maxTentativas,
    jogadores: sala.jogadores,
  });
}

// ═══════════════════════════════════════════════
//  SOCKET EVENTS
// ═══════════════════════════════════════════════

io.on('connection', socket => {
  // Solicitar lista de salas abertas
  socket.on('pedirSalas', () => {
    socket.emit('listaSalas', infoSalasAbertas());
  });

  socket.on('criarSala', ({ nome, tema }) => {
    const temaData = TEMAS[tema];
    if (!temaData) { socket.emit('erro', 'Tema inválido'); return; }

    const codigo = gerarCodigo();
    const MAX_RODADAS = 10;
    const embaralhadas = [...temaData.palavras].sort(() => Math.random() - 0.5).slice(0, MAX_RODADAS);
    salas[codigo] = {
      host: socket.id,
      jogadores: [{ id: socket.id, nome, pontos: 0 }],
      rodadaAtual: 0,
      palavras: embaralhadas,
      tema,
      emJogo: false,
      estadoRodada: {},
    };
    socket.join(codigo);
    socket.emit('salaCriada', {
      codigo,
      jogadores: salas[codigo].jogadores,
      temaNome: temaData.nome,
    });
    emitirListaSalas();
  });

  socket.on('entrarSala', ({ codigo, nome }) => {
    const sala = salas[codigo];
    if (!sala) { socket.emit('erro', 'Sala não encontrada'); return; }
    if (sala.emJogo) { socket.emit('erro', 'Jogo já em andamento'); return; }
    sala.jogadores.push({ id: socket.id, nome, pontos: 0 });
    socket.join(codigo);
    socket.emit('entrou', {
      codigo,
      jogadores: sala.jogadores,
      temaNome: TEMAS[sala.tema]?.nome,
    });
    io.to(codigo).emit('jogadoresAtualizado', { jogadores: sala.jogadores });
    emitirListaSalas();
  });

  socket.on('sairSala', ({ codigo }) => {
    sairDaSala(socket, codigo);
  });

  socket.on('iniciarJogo', ({ codigo }) => {
    const sala = salas[codigo];
    if (!sala || sala.host !== socket.id) return;
    sala.emJogo = true;
    emitirListaSalas();
    iniciarRodada(codigo);
  });

  socket.on('tentativa', async ({ codigo, tentativa }) => {
    const sala = salas[codigo];
    if (!sala) return;

    const rodada = sala.palavras[sala.rodadaAtual];
    const palavra = rodada.palavra;
    const nLetras = soLetras(palavra).length;

    const t = tentativa.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    if (t.length !== nLetras) {
      socket.emit('erroTentativa', `A palavra deve ter ${nLetras} letras`);
      return;
    }

    const validas = PALAVRAS_VALIDAS[nLetras];
    const noBanco = validas && validas.has(t);

    if (!noBanco) {
      // Verifica se ao menos existe no português
      const ehPalavraReal = await existeNoPortugues(t);
      if (!ehPalavraReal) {
        socket.emit('erroTentativa', 'Essa palavra não existe!');
      } else {
        socket.emit('erroTentativa', 'Palavra válida, mas fora do tema do jogo!');
      }
      return;
    }

    const estado = sala.estadoRodada[socket.id];
    if (!estado || estado.acertou || estado.acabou) return;

    const tentArr = t.split('');
    const resultado = checarPalavra(tentArr, palavra);
    const acertou = resultado.every(r => r === 'correct' || r === 'hyphen');

    const charsParaCliente = [];
    let li = 0;
    for (let i = 0; i < palavra.length; i++) {
      charsParaCliente.push(palavra[i] === '-' ? '-' : tentArr[li++]);
    }

    estado.tentativas.push({ letras: charsParaCliente, resultado });

    if (acertou) {
      estado.acertou = true;
      estado.acabou = true;
      const pontos = Math.max(10, 100 - (estado.tentativas.length - 1) * 15);
      const jogador = sala.jogadores.find(j => j.id === socket.id);
      if (jogador) jogador.pontos += pontos;
    } else if (estado.tentativas.length >= estado.maxTentativas) {
      estado.acabou = true;
    }

    socket.emit('resultadoTentativa', {
      tentativas: estado.tentativas,
      acertou: estado.acertou,
      acabou: estado.acabou,
      maxTentativas: estado.maxTentativas,
      palavra: estado.acabou ? palavra : null,
    });

    io.to(codigo).emit('jogadoresAtualizado', { jogadores: sala.jogadores });

    const todosFinaliz = sala.jogadores.every(j => {
      const e = sala.estadoRodada[j.id];
      return e && e.acabou;
    });

    if (todosFinaliz) {
      io.to(codigo).emit('rodadaFinalizada', {
        jogadores: [...sala.jogadores].sort((a, b) => b.pontos - a.pontos),
        palavra,
      });
    }
  });

  socket.on('pedirDica', ({ codigo }) => {
    const sala = salas[codigo];
    if (!sala) return;

    const rodada = sala.palavras[sala.rodadaAtual];
    const palavra = rodada.palavra;
    const estado = sala.estadoRodada[socket.id];
    if (!estado || estado.acabou) return;

    const hifens = posHifens(palavra);

    // Posições já corretas nas tentativas feitas
    const corretas = new Set();
    estado.tentativas.forEach(t =>
      t.resultado.forEach((r, i) => { if (r === 'correct') corretas.add(i); })
    );

    if (!estado.hintadas) estado.hintadas = new Set();

    // Posições disponíveis: letras não corretas e não hintadas
    const disponiveis = palavra.split('')
      .map((_, i) => i)
      .filter(i => !hifens.includes(i) && !corretas.has(i) && !estado.hintadas.has(i));

    if (!disponiveis.length) {
      socket.emit('dicaErro', 'Não há mais letras para revelar!');
      return;
    }

    const pos = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    estado.hintadas.add(pos);

    const CUSTO = 5;
    const jogador = sala.jogadores.find(j => j.id === socket.id);
    if (jogador) jogador.pontos = Math.max(0, jogador.pontos - CUSTO);

    socket.emit('dica', { posicao: pos, letra: palavra[pos], custo: CUSTO });
    io.to(codigo).emit('jogadoresAtualizado', { jogadores: sala.jogadores });
  });

  socket.on('proximaRodada', ({ codigo }) => {
    const sala = salas[codigo];
    if (!sala || sala.host !== socket.id) return;
    sala.rodadaAtual++;
    if (sala.rodadaAtual >= sala.palavras.length) {
      io.to(codigo).emit('jogoFinalizado', {
        jogadores: [...sala.jogadores].sort((a, b) => b.pontos - a.pontos),
      });
    } else {
      iniciarRodada(codigo);
    }
  });

  socket.on('disconnect', () => {
    for (const codigo in salas) {
      sairDaSala(socket, codigo, true);
    }
  });
});

function sairDaSala(socket, codigo, disconnect = false) {
  const sala = salas[codigo];
  if (!sala) return;
  const idx = sala.jogadores.findIndex(j => j.id === socket.id);
  if (idx === -1) return;

  sala.jogadores.splice(idx, 1);
  socket.leave(codigo);

  if (sala.host === socket.id || sala.jogadores.length === 0) {
    delete salas[codigo];
    io.to(codigo).emit('salaFechada');
  } else {
    if (sala.host === socket.id) sala.host = sala.jogadores[0].id;
    io.to(codigo).emit('jogadoresAtualizado', { jogadores: sala.jogadores });
  }
  emitirListaSalas();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor em http://localhost:${PORT}`));
