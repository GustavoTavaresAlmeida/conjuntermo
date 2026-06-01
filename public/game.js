const socket = io();

let meuCodigo = '';
let meuNome   = '';
let souHost   = false;
let hostId    = '';

let estadoJogo = {
  tamanho: 0, nLetras: 0, hifens: [],
  maxTentativas: 0, linhaAtual: 0, letraAtual: 0, acabou: false,
};

// ── Telas ──
function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(t => {
    t.classList.remove('ativa');
    t.style.display = 'none';
  });
  const tela = document.getElementById(id);
  tela.style.display = 'flex';
  requestAnimationFrame(() => tela.classList.add('ativa'));
}

// ══════════════════════════════════════════
//  TELA INICIAL
// ══════════════════════════════════════════

function getNome() {
  const n = document.getElementById('nome-input').value.trim();
  if (!n) { alert('Digite seu nome primeiro!'); return null; }
  return n;
}

function irParaCriar() {
  const nome = getNome(); if (!nome) return;
  meuNome = nome;
  mostrarTela('tela-criar');
}

function voltarInicio() { mostrarTela('tela-inicio'); }

function irParaEntrar() {
  const nome = getNome(); if (!nome) return;
  meuNome = nome;
  socket.emit('pedirSalas');
  mostrarTela('tela-entrar');
}

// ══════════════════════════════════════════
//  CRIAR SALA
// ══════════════════════════════════════════

// Clique nos cards de tema
document.querySelectorAll('.tema-card').forEach(card => {
  card.addEventListener('click', () => {
    card.querySelector('input[type=radio]').checked = true;
  });
});

function criarSala() {
  const tema = document.querySelector('input[name="tema"]:checked')?.value;
  if (!tema) { alert('Selecione um tema!'); return; }
  socket.emit('criarSala', { nome: meuNome, tema });
}

// ══════════════════════════════════════════
//  ENTRAR EM SALA
// ══════════════════════════════════════════

function atualizarSalas() { socket.emit('pedirSalas'); }

function renderizarListaSalas(salas) {
  const lista = document.getElementById('lista-salas');
  if (!salas.length) {
    lista.innerHTML = '<p class="sem-salas">Nenhuma sala aberta no momento</p>';
    return;
  }
  lista.innerHTML = salas.map(s => `
    <div class="sala-item" onclick="entrarPorItem('${s.codigo}')">
      <div class="sala-codigo">${s.codigo}</div>
      <div class="sala-info">
        <div class="sala-host">👤 ${s.host}</div>
        <div class="sala-sub">${s.jogadores} jogador${s.jogadores !== 1 ? 'es' : ''}</div>
      </div>
      <div class="sala-tema-badge ${s.temaKey}">${s.tema}</div>
    </div>
  `).join('');
}

function entrarPorItem(codigo) {
  socket.emit('entrarSala', { codigo, nome: meuNome });
}

function entrarPorCodigo() {
  const codigo = document.getElementById('codigo-input').value.trim().toUpperCase();
  if (!codigo) { alert('Digite o código da sala!'); return; }
  socket.emit('entrarSala', { codigo, nome: meuNome });
}

// ══════════════════════════════════════════
//  LOBBY
// ══════════════════════════════════════════

function renderizarLobby(jogadores) {
  document.getElementById('lista-jogadores-lobby').innerHTML = jogadores.map(j =>
    `<div class="jogador-chip ${j.id === hostId ? 'host' : ''}">${j.nome}</div>`
  ).join('');
}

function iniciarJogo() { socket.emit('iniciarJogo', { codigo: meuCodigo }); }

function sairDaSala() {
  if (!confirm('Quer sair da sala?')) return;
  socket.emit('sairSala', { codigo: meuCodigo });
  meuCodigo = '';
  mostrarTela('tela-inicio');
}

// ══════════════════════════════════════════
//  JOGO — GRADE
// ══════════════════════════════════════════

function construirGrade(tamanho, maxTentativas, hifens) {
  const grade = document.getElementById('grade');
  grade.innerHTML = '';
  const cell = tamanho >= 11 ? 38 : tamanho >= 9 ? 44 : tamanho >= 7 ? 50 : 58;
  document.documentElement.style.setProperty('--cell', cell + 'px');

  for (let i = 0; i < maxTentativas; i++) {
    const linha = document.createElement('div');
    linha.className = 'grade-linha';
    linha.id = `linha-${i}`;
    for (let j = 0; j < tamanho; j++) {
      const cel = document.createElement('div');
      cel.id = `cel-${i}-${j}`;
      cel.className = hifens.includes(j) ? 'celula hifen' : 'celula';
      if (hifens.includes(j)) cel.textContent = '-';
      linha.appendChild(cel);
    }
    grade.appendChild(linha);
  }
}

function ativarPrimeiraCelula() {
  let pos = 0;
  while (pos < estadoJogo.tamanho && estadoJogo.hifens.includes(pos)) pos++;
  estadoJogo.letraAtual = pos;
  if (pos < estadoJogo.tamanho)
    document.getElementById(`cel-${estadoJogo.linhaAtual}-${pos}`)?.classList.add('ativa');
}

// ══════════════════════════════════════════
//  JOGO — TECLADO
// ══════════════════════════════════════════

const LAYOUT = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L','⌫'],
  ['Z','X','C','V','B','N','M','ENTER'],
];

function construirTeclado() {
  const teclado = document.getElementById('teclado');
  teclado.innerHTML = '';
  LAYOUT.forEach(linha => {
    const row = document.createElement('div');
    row.className = 'teclado-linha';
    linha.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'tecla' + (k.length > 1 ? ' tecla-wide' : '');
      btn.textContent = k;
      btn.id = `tecla-${k}`;
      btn.onclick = () => processarTecla(k);
      row.appendChild(btn);
    });
    teclado.appendChild(row);
  });
}

function processarTecla(tecla) {
  if (estadoJogo.acabou) return;
  const linha = estadoJogo.linhaAtual;

  if (tecla === '⌫' || tecla === 'Backspace') {
    let pos = estadoJogo.letraAtual - 1;
    while (pos >= 0 && estadoJogo.hifens.includes(pos)) pos--;
    if (pos >= 0) {
      const cel = document.getElementById(`cel-${linha}-${pos}`);
      cel.textContent = '';
      cel.classList.remove('ativa');
      estadoJogo.letraAtual = pos;
      cel.classList.add('ativa');
    }
    return;
  }

  if (tecla === 'ENTER' || tecla === 'Enter') { enviarTentativa(); return; }
  if (!/^[A-Za-zÀ-ú]$/.test(tecla)) return;

  let pos = estadoJogo.letraAtual;
  while (pos < estadoJogo.tamanho && estadoJogo.hifens.includes(pos)) pos++;
  if (pos >= estadoJogo.tamanho) return;

  const cel = document.getElementById(`cel-${linha}-${pos}`);
  cel.textContent = tecla.toUpperCase();
  cel.classList.remove('ativa');
  cel.classList.add('pop');
  cel.addEventListener('animationend', () => cel.classList.remove('pop'), { once: true });

  let prox = pos + 1;
  while (prox < estadoJogo.tamanho && estadoJogo.hifens.includes(prox)) prox++;
  estadoJogo.letraAtual = prox;
  if (prox < estadoJogo.tamanho)
    document.getElementById(`cel-${linha}-${prox}`)?.classList.add('ativa');
}

function enviarTentativa() {
  const linha = estadoJogo.linhaAtual;
  const letras = [];
  for (let j = 0; j < estadoJogo.tamanho; j++) {
    if (estadoJogo.hifens.includes(j)) continue;
    letras.push(document.getElementById(`cel-${linha}-${j}`).textContent.trim());
  }
  if (letras.some(l => !l)) { sacudirLinha(linha); return; }
  socket.emit('tentativa', { codigo: meuCodigo, tentativa: letras.join('') });
}

function sacudirLinha(idx) {
  document.getElementById(`linha-${idx}`)?.querySelectorAll('.celula:not(.hifen)').forEach(c => {
    c.classList.add('shake');
    c.addEventListener('animationend', () => c.classList.remove('shake'), { once: true });
  });
}

function revelarLinha(idx, letras, resultado, cb) {
  letras.forEach((letra, j) => {
    setTimeout(() => {
      if (resultado[j] === 'hyphen') return;
      const cel = document.getElementById(`cel-${idx}-${j}`);
      cel.classList.add('flip');
      setTimeout(() => {
        cel.textContent = letra;
        cel.classList.add(resultado[j]);
        const tk = document.getElementById(`tecla-${letra}`);
        if (tk) {
          const prio = { correct: 3, present: 2, absent: 1 };
          const atual = ['correct','present','absent'].find(c => tk.classList.contains(c));
          if (!atual || prio[resultado[j]] > prio[atual]) {
            tk.classList.remove('correct','present','absent');
            tk.classList.add(resultado[j]);
          }
        }
      }, 220);
      cel.addEventListener('animationend', () => cel.classList.remove('flip'), { once: true });
      if (j === letras.length - 1 && cb) setTimeout(cb, 350);
    }, j * 110);
  });
}

// ══════════════════════════════════════════
//  SAIR DO JOGO
// ══════════════════════════════════════════

// ══════════════════════════════════════════
//  DICA
// ══════════════════════════════════════════

function pedirDica() {
  if (estadoJogo.acabou) return;
  const btn = document.getElementById('btn-dica');
  btn.disabled = true;
  setTimeout(() => { if (!estadoJogo.acabou) btn.disabled = false; }, 1500);
  socket.emit('pedirDica', { codigo: meuCodigo });
}

function confirmarSair() {
  if (!confirm('Deseja abandonar o jogo e voltar ao início?')) return;
  socket.emit('sairSala', { codigo: meuCodigo });
  meuCodigo = '';
  location.reload();
}

// ══════════════════════════════════════════
//  PLACAR / RANKING
// ══════════════════════════════════════════

function atualizarPlacarMini(jogadores) {
  document.getElementById('placar-mini').innerHTML = jogadores.map(j =>
    `<div class="placar-item">${j.nome} <span>${j.pontos}</span></div>`
  ).join('');
}

function mostrarRanking({ jogadores, palavra }) {
  document.getElementById('ranking-palavra').textContent = palavra.replace(/-/g, ' ');
  document.getElementById('ranking-lista').innerHTML = jogadores.map((j, i) =>
    `<div class="ranking-item ${i === 0 ? 'primeiro' : ''}">
      <div class="ranking-pos">${['🥇','🥈','🥉'][i] || (i+1)+'º'}</div>
      <div class="ranking-nome">${j.nome}</div>
      <div class="ranking-pts">${j.pontos} pts</div>
    </div>`
  ).join('');
  document.getElementById('btn-prox-host').classList.toggle('hidden', !souHost);
  document.getElementById('ranking-aguardando').classList.toggle('hidden', souHost);
  mostrarTela('tela-ranking');
}

function proximaRodada() { socket.emit('proximaRodada', { codigo: meuCodigo }); }

// ── Keyboard físico ──
document.addEventListener('keydown', e => {
  const jogo = document.getElementById('tela-jogo');
  if (jogo.classList.contains('ativa') && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName))
    processarTecla(e.key);
});

// ══════════════════════════════════════════
//  SOCKET EVENTS
// ══════════════════════════════════════════

socket.on('listaSalas', salas => renderizarListaSalas(salas));

socket.on('salaCriada', ({ codigo, jogadores, temaNome }) => {
  meuCodigo = codigo; souHost = true; hostId = socket.id;
  document.getElementById('codigo-sala').textContent = codigo;
  document.getElementById('tema-lobby').textContent = '📚 ' + temaNome;
  document.getElementById('btn-iniciar').classList.remove('hidden');
  document.getElementById('aguardando-msg').classList.add('hidden');
  renderizarLobby(jogadores);
  mostrarTela('tela-lobby');
});

socket.on('entrou', ({ codigo, jogadores, temaNome }) => {
  meuCodigo = codigo; souHost = false;
  document.getElementById('codigo-sala').textContent = codigo;
  document.getElementById('tema-lobby').textContent = '📚 ' + temaNome;
  document.getElementById('btn-iniciar').classList.add('hidden');
  document.getElementById('aguardando-msg').classList.remove('hidden');
  renderizarLobby(jogadores);
  mostrarTela('tela-lobby');
});

socket.on('jogadoresAtualizado', ({ jogadores }) => {
  renderizarLobby(jogadores);
  atualizarPlacarMini(jogadores);
});

socket.on('novaRodada', ({ rodada, totalRodadas, tamanho, nLetras, hifens, tipo, dica, maxTentativas, jogadores }) => {
  estadoJogo = { tamanho, nLetras, hifens, maxTentativas, linhaAtual: 0, letraAtual: 0, acabou: false };

  document.getElementById('rodada-info').textContent = `Rodada ${rodada}/${totalRodadas}`;
  document.getElementById('tipo-info').textContent = tipo;
  document.getElementById('dica-texto').textContent = dica;
  document.getElementById('msg-resultado').classList.add('hidden');
  document.getElementById('aguardando-proximo').classList.add('hidden');

  construirGrade(tamanho, maxTentativas, hifens);
  construirTeclado();
  atualizarPlacarMini(jogadores);
  ativarPrimeiraCelula();

  // Reseta botão de dica
  const btnDica = document.getElementById('btn-dica');
  if (btnDica) btnDica.disabled = false;

  mostrarTela('tela-jogo');
});

socket.on('resultadoTentativa', ({ tentativas, acertou, acabou, palavra }) => {
  const ultima = tentativas[tentativas.length - 1];
  revelarLinha(estadoJogo.linhaAtual, ultima.letras, ultima.resultado, () => {
    estadoJogo.linhaAtual++;
    estadoJogo.letraAtual = 0;
    estadoJogo.acabou = acabou;

    if (acertou) {
      const m = document.getElementById('msg-resultado');
      m.textContent = `✅ Correto! +${Math.max(10, 100 - (tentativas.length - 1) * 15)} pontos`;
      m.className = 'msg-resultado acerto';
      m.classList.remove('hidden');
    } else if (acabou) {
      const m = document.getElementById('msg-resultado');
      m.textContent = `❌ Era: ${palavra.replace(/-/g, ' ')}`;
      m.className = 'msg-resultado erro';
      m.classList.remove('hidden');
    } else {
      ativarPrimeiraCelula();
    }

    if (acabou) {
      const ag = document.getElementById('aguardando-proximo');
      ag.textContent = 'Aguardando todos terminarem...';
      ag.classList.remove('hidden');
    }
  });
});

socket.on('rodadaFinalizada', ({ jogadores, palavra }) => mostrarRanking({ jogadores, palavra }));

socket.on('jogoFinalizado', ({ jogadores }) => {
  document.getElementById('fim-ranking').innerHTML = jogadores.map((j, i) =>
    `<div class="ranking-item ${i === 0 ? 'primeiro' : ''}">
      <div class="ranking-pos">${['🥇','🥈','🥉'][i] || (i+1)+'º'}</div>
      <div class="ranking-nome">${j.nome}</div>
      <div class="ranking-pts">${j.pontos} pts</div>
    </div>`
  ).join('');
  mostrarTela('tela-fim');
});

socket.on('erro', msg => alert('Erro: ' + msg));

socket.on('erroTentativa', msg => {
  sacudirLinha(estadoJogo.linhaAtual);
  const m = document.getElementById('msg-resultado');
  m.textContent = msg;
  m.className = 'msg-resultado aviso';
  m.classList.remove('hidden');
  setTimeout(() => m.classList.add('hidden'), 2000);
});

socket.on('dica', ({ posicao, letra, custo }) => {
  const linha = estadoJogo.linhaAtual;
  const cel = document.getElementById(`cel-${linha}-${posicao}`);
  if (!cel) return;

  // Preenche a célula com a letra revelada (estilo dourado)
  cel.textContent = letra;
  cel.classList.remove('ativa');
  cel.classList.add('hinted', 'dica-flash');
  cel.addEventListener('animationend', () => cel.classList.remove('dica-flash'), { once: true });

  // Avança cursor para próxima célula livre (que não seja hifen nem hintada)
  let pos = 0;
  while (pos < estadoJogo.tamanho) {
    if (!estadoJogo.hifens.includes(pos)) {
      const c = document.getElementById(`cel-${linha}-${pos}`);
      if (c && !c.textContent.trim()) break;
    }
    pos++;
  }
  estadoJogo.letraAtual = pos;
  document.querySelectorAll(`#linha-${linha} .celula`).forEach(c => c.classList.remove('ativa'));
  if (pos < estadoJogo.tamanho) {
    document.getElementById(`cel-${linha}-${pos}`)?.classList.add('ativa');
  }

  // Feedback visual
  const m = document.getElementById('msg-resultado');
  m.textContent = `💡 Dica usada! −${custo} pontos`;
  m.className = 'msg-resultado aviso';
  m.classList.remove('hidden');
  setTimeout(() => m.classList.add('hidden'), 2000);
});

socket.on('dicaErro', msg => {
  const m = document.getElementById('msg-resultado');
  m.textContent = '⚠️ ' + msg;
  m.className = 'msg-resultado aviso';
  m.classList.remove('hidden');
  setTimeout(() => m.classList.add('hidden'), 2000);
});

socket.on('salaFechada', () => {
  alert('A sala foi encerrada pelo host.');
  location.reload();
});
