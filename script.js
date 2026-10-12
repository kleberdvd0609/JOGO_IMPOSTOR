/* Interface + motor do jogo no navegador. */
const $ = s => document.querySelector(s), app = $('#app');
let T = [], iv, G, S = { n: 5, modo: 1, tempo: 90, nomes: [] };
const later = (f, m) => T.push(setTimeout(f, m));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = t => (t / 60 | 0) + ':' + String(t % 60).padStart(2, '0');
const PARES = [
  ["Pizza", "Lasanha"], ["Praia", "Piscina"], ["Gato", "Cachorro"], ["Violão", "Guitarra"], ["Café", "Chá"],
  ["Futebol", "Vôlei"], ["Avião", "Helicóptero"], ["Hospital", "Escola"], ["Chuva", "Neve"], ["Banana", "Manga"],
  ["Cinema", "Teatro"], ["Ônibus", "Metrô"], ["Sol", "Lua"], ["Biblioteca", "Livraria"], ["Pão", "Bolo"],
  ["Sushi", "Temaki"], ["Coxinha", "Pastel"], ["Brigadeiro", "Beijinho"], ["Açaí", "Sorvete"], ["Hambúrguer", "Hot-dog"],
  ["Feijoada", "Churrasco"], ["Brasil", "Portugal"], ["França", "Itália"], ["Japão", "China"], ["Espanha", "Argentina"],
  ["México", "Chile"], ["Messi", "Cristiano Ronaldo"], ["Anitta", "Ludmilla"], ["Beyoncé", "Rihanna"], ["Neymar", "Vinícius Júnior"],
  ["Taylor Swift", "Ariana Grande"], ["Batman", "Superman"], ["Harry Potter", "Percy Jackson"], ["Minecraft", "Roblox"], ["TikTok", "Instagram"]
];
/* Motor do jogo no navegador: espelha as rotas /api/... do servidor em C (a página publicada não tem servidor). */
const E = { J: [], n: 0, rodada: 1, ativo: false, cand: [], tent: 0, emp: [], dec: -1, ev: 0 };
const lim = (v, a, b) => Math.min(b, Math.max(a, v)), bad = m => ({ ok: false, erro: m });
const alive = () => E.J.map((_, i) => i).filter(i => E.J[i].vivo);
const zero = () => E.J.forEach(j => { j.votos = 0; j.votou = false });
const rv = () => ({ ok: true, tent: E.tent, cand: [...E.cand], eleitores: alive() });
const H = {
  novo(q) {
    const n = lim(+q.get('n') || 5, 4, 8), md = +q.get('modo') || 1, nm = (q.get('nomes') || '').split(','); E.tempo = lim(+q.get('tempo') || 90, 30, 600);
    E.n = n; E.J = Array.from({ length: n }, (_, i) => ({ nome: (nm[i] || '').trim() || 'Jogador ' + (i + 1), imp: false, vivo: true, votos: 0, votou: false }));
    const par = PARES[Math.random() * PARES.length | 0]; E.civil = par[0]; E.impW = md == 1 ? par[1] : null; E.J[Math.random() * n | 0].imp = true;
    E.rodada = 1; E.ativo = true; E.dec = -1; E.ev = 0; return { ok: true, n, tempo: E.tempo, rodada: 1, total: 2, nomes: E.J.map(j => j.nome) }
  },
  papel(q) { const j = E.J[+q.get('i')]; if (!E.ativo || !j) return bad('Jogador inválido.'); return { ok: true, imp: j.imp, palavra: j.imp ? E.impW : E.civil } },
  ordem() { if (!E.ativo) return bad('Nenhuma partida em andamento.'); const o = alive(); for (let i = o.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[o[i], o[j]] = [o[j], o[i]] } return { ok: true, rodada: E.rodada, total: 2, ordem: o } },
  votacao_ini() { if (!E.ativo) return bad('Nenhuma partida em andamento.'); E.cand = alive(); E.tent = 0; E.dec = -1; E.ev = 0; zero(); return rv() },
  voto(q) {
    const v = +q.get('v'), c = +q.get('c'), a = E.J[v], b = E.J[c]; if (!E.ativo || !a || !b) return bad('Voto inválido.');
    if (!a.vivo || a.votou) return bad('Este jogador não pode votar agora.'); if (!E.cand.includes(c) || c === v) return bad('Candidato inválido.'); b.votos++; a.votou = true; return { ok: true }
  },
  apurar() {
    if (!E.ativo) return bad('Nenhuma partida em andamento.'); if (alive().some(i => !E.J[i].votou)) return bad('Ainda faltam votos.');
    const vv = E.cand.map(c => E.J[c].votos), max = Math.max(...vv); E.emp = E.cand.filter((c, i) => vv[i] === max); let r;
    if (E.emp.length == 1) { E.dec = E.emp[0]; E.ev = 1; r = 'expulso' } else if (E.tent >= 2) { E.ev = 3; r = 'sorteio' } else { E.ev = 2; r = 'empate' }
    return { ok: true, resultado: r, total: vv.reduce((a, b) => a + b, 0), cand: [...E.cand], votos: vv, empatados: [...E.emp] }
  },
  desempate() { if (E.ev !== 2) return bad('Não há empate para desempatar.'); E.cand = [...E.emp]; E.tent++; E.ev = 0; zero(); return rv() },
  sortear() { if (E.ev !== 3) return bad('Sorteio não permitido agora.'); E.dec = E.emp[Math.random() * E.emp.length | 0]; E.ev = 1; return { ok: true, expulso: E.dec } },
  expulsar() {
    if (!E.ativo || E.dec < 0) return bad('Ninguém foi escolhido para expulsão.'); const p = E.J[E.dec]; p.vivo = false; E.dec = -1; E.ev = 0;
    let fim = true, civ = false, motivo = '';
    if (p.imp) { civ = true; motivo = 'O IMPOSTOR foi expulso!' } else if (E.J.filter(j => j.vivo && !j.imp).length <= 1) motivo = 'O IMPOSTOR igualou o número de cidadãos!';
    else if (E.rodada >= 2) motivo = 'O IMPOSTOR sobreviveu a todas as rodadas!'; else { fim = false; E.rodada++ }
    const r = { ok: true, nome: p.nome, imp: p.imp, fim, rodada: E.rodada, vencedor: civ ? 'cidadaos' : 'IMPOSTOR', motivo };
    if (fim) { E.ativo = false; Object.assign(r, { civil: E.civil, impW: E.impW, papeis: E.J.map(j => ({ nome: j.nome, imp: j.imp })) }) } return r
  }
};
const api = async p => { const [k, qs] = p.split('?'); return H[k] ? H[k](new URLSearchParams(qs || '')) : bad('Rota desconhecida.') };
const falha = r => alert(r.erro || 'Erro inesperado.');
const nome = i => G.nomes[i];
function show(h, tag) { T.forEach(clearTimeout); T = []; clearInterval(iv); app.innerHTML = h; $('#tag').textContent = tag || ''; window.scrollTo(0, 0) }
const rtag = () => `Rodada ${G.rodada} de ${G.total}`;
function passo(nm, sub, btn, fn, tag) {
  show(`<section class="card pass"><p class="m">Passe o aparelho para</p><h2 class="big">${esc(nm)}</h2><p class="m">${sub}</p><button class="btn" id="b">${btn}</button></section>`, tag);
  $('#b').onclick = fn
}

/* ---------- configuração ---------- */
const seg = (id, vals, cur) => `<div class="seg" id="${id}">${vals.map(([v, l]) => `<button data-v="${v}" class="${v == cur ? 'on' : ''}">${l}</button>`).join('')}</div>`;
const mark = (sel, v) => [...$(sel).children].forEach(b => b.classList.toggle('on', b.dataset.v == v));
function setup() {
  show(`<section class="card"><h1>Quem é o IMPOSTOR?</h1>
  <p class="m">Jogo de dedução em grupo no mesmo aparelho: as pistas são ditas em voz alta, o sorteio define os papéis e a votação decide o destino da nave.</p>
  <label>Jogadores</label>${seg('nn', [4, 5, 6, 7, 8].map(x => [x, x]), S.n)}
  <div id="nl"></div>
  <label>Palavra do IMPOSTOR</label>${seg('nm', [[1, 'Parecida'], [2, 'Nenhuma']], S.modo)}
  <label for="tp">Discussão por rodada (30 a 600 s)</label><input class="in" id="tp" type="number" min="30" max="600" value="${S.tempo}">
  <button class="btn" id="go">Começar partida</button></section>`);
  const names = () => { $('#nl').innerHTML = Array.from({ length: S.n }, (_, i) => `<input class="in" data-i="${i}" maxlength="20" placeholder="Jogador ${i + 1}" value="${esc(S.nomes[i] || '')}">`).join('') };
  names();
  $('#nl').oninput = e => { S.nomes[+e.target.dataset.i] = e.target.value };
  $('#nn').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.n = +b.dataset.v; mark('#nn', S.n); names() };
  $('#nm').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.modo = +b.dataset.v; mark('#nm', S.modo) };
  $('#go').onclick = () => { S.tempo = Math.min(600, Math.max(30, +$('#tp').value || 90)); iniciar() }
}
async function iniciar() {
  const nomes = Array.from({ length: S.n }, (_, i) => (S.nomes[i] || '').replace(/,/g, ' ').trim() || 'Jogador ' + (i + 1));
  const r = await api(`novo?n=${S.n}&modo=${S.modo}&tempo=${S.tempo}&nomes=${encodeURIComponent(nomes.join(','))}`);
  if (!r.ok) return falha(r);
  G = { nomes: r.nomes, tempo: r.tempo, rodada: r.rodada, total: r.total };
  passRole(0)
}

/* ---------- papéis ---------- */
function passRole(i) {
  passo(nome(i), `Só ${esc(nome(i))} deve olhar a tela.`, 'Ver meu papel', async () => {
    const p = await api('papel?i=' + i); if (!p.ok) return falha(p);
    show(`<section class="card center">${p.imp ? '<span class="stamp">IMPOSTOR</span>' : '<span class="stamp ok">CIDADÃO</span>'}
    <p class="m" style="margin-top:22px">${p.imp ? (p.palavra ? 'Sua palavra (diferente da dos outros):' : 'Você não tem palavra. Disfarce e descubra a dos outros.') : 'Palavra secreta:'}</p>
    ${p.palavra ? `<div class="word">${esc(p.palavra)}</div>` : ''}
    <button class="btn" id="b">Decorei, esconder</button></section>`, 'Distribuição de papéis');
    $('#b').onclick = () => i + 1 < G.nomes.length ? passRole(i + 1) : rodada()
  }, 'Distribuição de papéis')
}

/* ---------- dicas faladas + discussão ---------- */
async function rodada() {
  const r = await api('ordem'); if (!r.ok) return falha(r);
  show(`<section class="card"><h2>Dicas, em voz alta</h2>
  <p class="m">Cada um diz uma dica curta, sem dizer a palavra. Ordem de fala:</p>
  <ol class="ord">${r.ordem.map(i => `<li>${esc(nome(i))}</li>`).join('')}</ol>
  <button class="btn" id="b">Abrir discussão</button></section>`, rtag());
  $('#b').onclick = discussao
}
function discussao() {
  let t = G.tempo;
  show(`<section class="card"><h2>Discussão</h2>
  <p class="m">Cheguem a um acordo sobre quem expulsar.</p>
  <div class="timer" id="tm" role="timer">${fmt(t)}</div>
  <button class="btn" id="b" disabled>Ir à votação</button>
  <button class="btn ghost" id="e">Já temos acordo, encerrar</button></section>`, rtag());
  $('#b').onclick = $('#e').onclick = async () => { const r = await api('votacao_ini'); r.ok ? votar(r) : falha(r) };
  iv = setInterval(() => { t--; $('#tm').textContent = fmt(t); if (t <= 0) { clearInterval(iv); $('#tm').classList.add('fim'); $('#b').disabled = false } }, 1000)
}

/* ---------- votação ---------- */
function votar(r) { G.cand = r.cand; G.voters = r.eleitores; G.tent = r.tent; G.vi = 0; passVoto() }
const vtag = () => rtag() + (G.tent ? ' · desempate' : '');
function passVoto() {
  if (G.vi >= G.voters.length) return apurar();
  const v = G.voters[G.vi];
  passo(nome(v), 'Voto secreto: só você deve olhar.', 'Ver cédula', () => cedula(v), vtag())
}
function cedula(v) {
  const ops = G.cand.filter(c => c !== v); let sel = null;
  show(`<section class="card ballot"><h2>Cédula de ${esc(nome(v))}</h2>
  <p class="m">Quem deve ser expulso?${G.tent ? ' Vote só entre os empatados.' : ''}</p>
  <div id="ops">${ops.map(c => `<button class="op" data-c="${c}"><span class="box"></span>${esc(nome(c))}</button>`).join('')}</div>
  <button class="btn" id="cf" disabled>Escolha um nome</button></section>`, vtag());
  $('#ops').onclick = e => {
    const b = e.target.closest('.op'); if (!b) return; sel = +b.dataset.c;
    [...$('#ops').children].forEach(x => x.classList.toggle('on', x === b));
    $('#cf').disabled = false; $('#cf').textContent = 'Confirmar voto em ' + nome(sel)
  };
  $('#cf').onclick = async () => {
    const r = await api(`voto?v=${v}&c=${sel}`); if (!r.ok) return falha(r);
    show(`<section class="card pass"><h2>Voto registrado</h2><p class="m">Passe o aparelho adiante.</p></section>`, vtag());
    later(() => { G.vi++; passVoto() }, 1100)
  }
}
async function apurar() {
  const r = await api('apurar'); if (!r.ok) return falha(r);
  const par = r.cand.map((c, i) => ({ c, v: r.votos[i] })).sort((a, b) => a.v - b.v), max = Math.max(...r.votos, 1);
  show(`<section class="card"><h2>Apuração</h2><p class="m">${r.total} votos, todos anônimos.</p>
  ${par.map(x => `<div class="row"><span>${esc(nome(x.c))}</span><div class="trk"><i class="bar" style="--w:${x.v / max * 100}%"></i></div><b>${x.v}</b></div>`).join('')}
  <div id="fx"></div></section>`, vtag());
  const rows = [...app.querySelectorAll('.row')];
  rows.forEach((el, i) => later(() => el.classList.add('in'), 500 + i * 900));
  const lista = r.empatados.map(c => esc(nome(c))).join(', ');
  later(() => {
    if (r.resultado === 'expulso') {
      $('#fx').innerHTML = `<button class="btn" id="b">Revelar expulsão</button>`; $('#b').onclick = expulsar
    } else if (r.resultado === 'sorteio') {
      $('#fx').innerHTML = `<p class="m" style="margin-top:16px">Empate de novo entre ${lista}. A sorte decide.</p><button class="btn" id="b">Sortear</button>`;
      $('#b').onclick = () => sortear(r.empatados)
    } else {
      $('#fx').innerHTML = `<p class="m" style="margin-top:16px">Empate entre ${lista}. Alguém precisa sair: votem de novo, só entre eles.</p><button class="btn" id="b">Votar entre os empatados</button>`;
      $('#b').onclick = async () => { const d = await api('desempate'); d.ok ? votar(d) : falha(d) }
    }
  }, 700 + rows.length * 900)
}
async function sortear(emp) {
  const s = await api('sortear'); if (!s.ok) return falha(s);
  show(`<section class="card pass"><p class="m">A sorte decide...</p><h2 class="big" id="nm">?</h2></section>`, vtag());
  iv = setInterval(() => { $('#nm').textContent = nome(emp[Math.random() * emp.length | 0]) }, 90);
  later(() => { clearInterval(iv); $('#nm').textContent = nome(s.expulso); later(expulsar, 1200) }, 2200)
}

/* ---------- expulsão e fim ---------- */
async function expulsar() {
  const r = await api('expulsar'); if (!r.ok) return falha(r);
  show(`<section class="card center"><h2 class="big">${esc(r.nome)}</h2><p class="m">foi expulso(a) da nave...</p><div id="res" style="min-height:130px"></div></section>`, rtag());
  later(() => {
    $('#res').innerHTML = r.imp ? `<span class="stamp">ERA O IMPOSTOR</span>` : `<span class="stamp ok">ERA INOCENTE</span><p class="m" style="margin-top:14px">O IMPOSTOR continua entre vocês.</p>`;
    $('#res').insertAdjacentHTML('beforeend', `<button class="btn" id="b">${r.fim ? 'Ver resultado' : 'Ir para a rodada ' + r.rodada}</button>`);
    $('#b').onclick = () => { if (r.fim) fim(r); else { G.rodada = r.rodada; rodada() } }
  }, 2400)
}
function fim(r) {
  const civ = r.vencedor === 'cidadaos';
  show(`<section class="card center"><span class="stamp ${civ ? 'ok' : ''}">${civ ? 'VITÓRIA DOS CIDADÃOS' : 'VITÓRIA DO IMPOSTOR'}</span>
  <p class="m" style="margin-top:18px">${esc(r.motivo)}</p>
  <p>Palavra dos cidadãos: <b>${esc(r.civil)}</b><br>Palavra do IMPOSTOR: <b>${r.impW ? esc(r.impW) : 'nenhuma'}</b></p>
  <ul class="roles">${r.papeis.map(p => `<li><span>${esc(p.nome)}</span><b style="color:${p.imp ? 'var(--stamp)' : 'var(--mute)'}">${p.imp ? 'IMPOSTOR' : 'Cidadão'}</b></li>`).join('')}</ul>
  <button class="btn" id="b">Jogar de novo</button></section>`, 'Fim de jogo');
  $('#b').onclick = setup
}
setup();
