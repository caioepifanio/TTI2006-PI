// =====================================================
//  CONFIGURAÇÃO DOS MENUS (um para cada tipo de usuário)
// =====================================================
const PAPEIS = {
  voluntario: {
    rotulo: "Voluntário",
    home: "home-voluntario",
    menu: [
      { titulo: "Pedidos",    itens: [["Novos pedidos", "pagina-novos-pedidos"], ["Meus pedidos", "pagina-meus-pedidos"]] },
      { titulo: "Impressora", itens: [["Cadastrar impressora", "cadastrar-impressora"], ["Minhas impressoras", "pagina-minhas-impressoras"]] },
      { titulo: "Produção",   itens: [["Em produção", "em-producao"], ["Concluídos", "pagina-concluidos"]] },
      { titulo: "Sobre",      link: "pagina-sobre" },
    ],
  },
  funcionario: {
    rotulo: "Funcionário",
    home: "home-funcionario",
    menu: [
      { titulo: "Demandas",    itens: [["Novas demandas", "pagina-novas-demandas"], ["Acompanhar demandas", "pagina-acompanhar-demandas"]] },
      { titulo: "Voluntários", itens: [["Lista de voluntários", "pagina-lista-voluntarios"], ["Aprovar cadastros", "pagina-aprovar-cadastros"]] },
      { titulo: "Próteses",    itens: [["Catálogo", "pagina-catalogo"], ["Estoque", "pagina-estoque"]] },
      { titulo: "Sobre",       link: "pagina-sobre" },
    ],
  },
};

// Títulos das páginas que ainda não têm tela própria (gerados a partir dos menus)
const TITULOS = { "pagina-sobre": "Sobre", "pagina-perfil": "Meu perfil" };
Object.values(PAPEIS).forEach(p =>
  p.menu.forEach(m => (m.itens || []).forEach(([t, id]) => { if (id.startsWith("pagina-")) TITULOS[id] = t; }))
);

// =====================================================
//  FUNÇÕES AUXILIARES
// =====================================================
const $ = id => document.getElementById(id);
const emailValido = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const normalizar = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function mensagem(form, texto, tipo = "erro") {
  const el = form.querySelector(".mensagem, .mensagem-app");
  el.textContent = texto;
  el.className = el.classList[0] + " " + tipo;
}

function marcar(input, invalido) {
  input.classList.toggle("invalido", invalido);
}

// "Banco de dados" de demonstração no navegador (localStorage).
// Em um sistema real, os dados devem ir para um servidor.
function lerLista(nome) {
  try { return JSON.parse(localStorage.getItem(nome)) || []; }
  catch { return []; }
}
function salvarLista(nome, lista) {
  try { localStorage.setItem(nome, JSON.stringify(lista)); } catch {}
}

// =====================================================
//  SESSÃO (quem está logado)
// =====================================================
function carregarSessao() {
  try { return JSON.parse(sessionStorage.getItem("sessao")); } catch { return null; }
}
let sessao = carregarSessao() || { papel: null, nome: "user" };

function entrar(papel, nome) {
  sessao = { papel, nome };
  try { sessionStorage.setItem("sessao", JSON.stringify(sessao)); } catch {}
  location.hash = PAPEIS[papel].home;
}

$("sair").addEventListener("click", () => {
  sessao = { papel: null, nome: "user" };
  try { sessionStorage.removeItem("sessao"); } catch {}
});

// =====================================================
//  NAVEGAÇÃO ENTRE TELAS (usa o # da URL)
// =====================================================
const telas = document.querySelectorAll(".screen");
const header = $("app-header");
const historico = [];

function mostrarTela() {
  fecharMenus();
  let id = location.hash.slice(1) || "inicio";
  let alvo = TITULOS[id] ? $("pagina") : $(id);
  if (!alvo || !alvo.classList.contains("screen") || alvo.id === "pagina" && !TITULOS[id]) {
    id = "inicio";
    alvo = $("inicio");
  }

  telas.forEach(t => t.classList.remove("ativa"));
  alvo.classList.add("ativa");

  // cabeçalho do sistema
  const ehSistema = alvo.classList.contains("app-screen");
  header.hidden = !ehSistema;
  if (ehSistema) {
    const papel = alvo.dataset.papel || sessao.papel || "voluntario";
    sessao.papel = papel;
    document.body.classList.toggle("papel-funcionario", papel === "funcionario");
    montarCabecalho(papel, id);
    if (alvo.id === "pagina") montarPagina(id);
    if (id === "em-producao") renderizarProducao();
  } else {
    document.body.classList.remove("papel-funcionario");
  }

  // guarda a tela anterior (para o "Voltar para tela anterior")
  if (historico[historico.length - 1] !== id) historico.push(id);

  // limpa mensagens ao trocar de tela
  alvo.querySelectorAll(".mensagem").forEach(m => { m.textContent = ""; m.className = "mensagem"; });
  window.scrollTo(0, 0);
}

$("voltar-anterior").addEventListener("click", e => {
  e.preventDefault();
  const anterior = historico.length > 1 ? historico[historico.length - 2] : "inicio";
  location.hash = anterior === "esqueci-senha" ? "inicio" : anterior;
});

// =====================================================
//  CABEÇALHO E MENUS SUSPENSOS
// =====================================================
function montarCabecalho(papel, idAtual) {
  const cfg = PAPEIS[papel];

  $("app-nav").innerHTML = cfg.menu.map(m => {
    if (m.link) {
      return `<a class="nav-item ${idAtual === m.link ? "atual" : ""}" href="#${m.link}">${m.titulo}</a>`;
    }
    const atual = m.itens.some(([, h]) => h === idAtual) ? "atual" : "";
    return `
      <div class="nav-grupo">
        <button type="button" class="nav-item ${atual}" aria-haspopup="true" aria-expanded="false">
          ${m.titulo} <span class="seta">▼</span>
        </button>
        <div class="dropdown">
          ${m.itens.map(([t, h]) => `<a href="#${h}">${t}</a>`).join("")}
        </div>
      </div>`;
  }).join("");

  const nome = sessao.nome || "user";
  $("usuario-nome").textContent = nome;
  $("usuario-papel").textContent = cfg.rotulo;
  $("avatar").textContent = nome.charAt(0).toUpperCase();
  $("app-logo").href = "#" + cfg.home;
  document.querySelectorAll("[data-home]").forEach(a => (a.href = "#" + cfg.home));
  document.querySelectorAll("[data-nome]").forEach(s => (s.textContent = nome));
}

function fecharMenus() {
  document.querySelectorAll(".aberto").forEach(el => {
    el.classList.remove("aberto");
    el.querySelector("button").setAttribute("aria-expanded", "false");
  });
}

document.addEventListener("click", e => {
  const botao = e.target.closest(".nav-grupo > button, #usuario-btn");
  if (botao) {
    const estavaAberto = botao.parentElement.classList.contains("aberto");
    fecharMenus();
    if (!estavaAberto) {
      botao.parentElement.classList.add("aberto");
      botao.setAttribute("aria-expanded", "true");
    }
    return;
  }
  if (!e.target.closest(".dropdown") || e.target.closest(".dropdown a")) fecharMenus();
});

document.addEventListener("keydown", e => { if (e.key === "Escape") fecharMenus(); });

// =====================================================
//  PÁGINAS DO MENU AINDA SEM TELA PRÓPRIA
// =====================================================
function montarPagina(id) {
  $("pagina-titulo").textContent = TITULOS[id];
  let corpo;

  if (id === "pagina-sobre") {
    corpo = `<p class="texto-pagina">Plataforma do Projeto Integrador que conecta voluntários que têm
      impressoras 3D ao Hospital Ortopédico AACD, para a produção de próteses e órteses para os pacientes.</p>`;
  } else if (id === "pagina-perfil") {
    corpo = `<ul class="lista-cards"><li><b>${esc(sessao.nome)}</b><span>${PAPEIS[sessao.papel].rotulo}</span></li></ul>`;
  } else if (id === "pagina-minhas-impressoras") {
    const lista = lerLista("impressoras");
    corpo = lista.length
      ? `<ul class="lista-cards">${lista.map(i => `
          <li><b>${esc(i.nome)}</b>
          <span>${esc(i.marca)} ${esc(i.modelo)} · ${esc(i.tecnologia)} · ${esc(i.local)}</span></li>`).join("")}</ul>`
      : `<p class="vazio">Nenhuma impressora cadastrada ainda. <a href="#cadastrar-impressora">Cadastrar impressora</a></p>`;
  } else if (id === "pagina-lista-voluntarios") {
    const lista = lerLista("voluntarios");
    corpo = lista.length
      ? `<ul class="lista-cards">${lista.map(v => `
          <li><b>${esc(v.nome)}</b><span>${esc(v.email)} · ${esc(v.telefone)}</span></li>`).join("")}</ul>`
      : `<p class="vazio">Nenhum voluntário cadastrado ainda.</p>`;
  } else {
    corpo = `<p class="texto-pagina">Esta tela ainda está em desenvolvimento.</p>`;
  }

  $("pagina-corpo").innerHTML = corpo;
}

// =====================================================
//  MÁSCARAS (CNPJ e Telefone)
// =====================================================
const cnpj = $("cad-cnpj");
cnpj.addEventListener("input", () => {
  let v = cnpj.value.replace(/\D/g, "").slice(0, 14);
  v = v.replace(/^(\d{2})(\d)/, "$1.$2")
       .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
       .replace(/\.(\d{3})(\d)/, ".$1/$2")
       .replace(/(\d{4})(\d)/, "$1-$2");
  cnpj.value = v;
});

const telefone = $("cad-telefone");
telefone.addEventListener("input", () => {
  let v = telefone.value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 10)      v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  else if (v.length > 6)  v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  else if (v.length > 2)  v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  else if (v.length > 0)  v = v.replace(/^(\d{0,2})/, "($1");
  telefone.value = v;
});

// remove o destaque de erro ao digitar
["input", "change"].forEach(evento =>
  document.addEventListener(evento, e => {
    if (!e.target.matches("input, select")) return;
    marcar(e.target, false);
    const aviso = e.target.parentElement.querySelector(".erro-campo");
    if (aviso) aviso.textContent = "";
  })
);

// =====================================================
//  LOGIN FUNCIONÁRIO
// =====================================================
$("form-funcionario").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const email = $("func-email");
  const senha = $("func-senha");

  marcar(email, !emailValido(email.value));
  marcar(senha, senha.value.length === 0);

  if (!emailValido(email.value)) return mensagem(form, "Digite um email válido.");
  if (!email.value.toLowerCase().endsWith("@aacd.org.br"))
    return mensagem(form, "Use seu email institucional (@aacd.org.br).");
  if (!senha.value) return mensagem(form, "Digite sua senha.");

  const nome = email.value.split("@")[0];
  form.reset();
  entrar("funcionario", nome);
});

// =====================================================
//  LOGIN VOLUNTÁRIO
// =====================================================
$("form-voluntario").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const email = $("vol-email");
  const senha = $("vol-senha");

  marcar(email, !emailValido(email.value));
  marcar(senha, senha.value.length === 0);

  if (!emailValido(email.value)) return mensagem(form, "Digite um email válido.");
  if (!senha.value) return mensagem(form, "Digite sua senha.");

  const usuario = lerLista("voluntarios").find(v => v.email === email.value.trim().toLowerCase());
  if (!usuario) return mensagem(form, "Conta não encontrada. Cadastre-se.");
  if (usuario.senha !== senha.value) return mensagem(form, "Senha incorreta.");

  form.reset();
  entrar("voluntario", usuario.nome.split(" ")[0]);
});

// =====================================================
//  CADASTRO
// =====================================================
$("form-cadastro").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const campos = {
    nome:     $("cad-nome"),
    email:    $("cad-email"),
    cnpj:     $("cad-cnpj"),
    endereco: $("cad-endereco"),
    telefone: $("cad-telefone"),
    senha:    $("cad-senha"),
    confirma: $("cad-confirma"),
  };

  // campos vazios
  let vazio = false;
  Object.values(campos).forEach(c => {
    const v = c.value.trim() === "";
    marcar(c, v);
    if (v) vazio = true;
  });
  if (vazio) return mensagem(form, "Preencha todos os campos.");

  if (!emailValido(campos.email.value)) {
    marcar(campos.email, true);
    return mensagem(form, "Email inválido.");
  }
  if (campos.cnpj.value.replace(/\D/g, "").length !== 14) {
    marcar(campos.cnpj, true);
    return mensagem(form, "CNPJ deve ter 14 números.");
  }
  if (campos.telefone.value.replace(/\D/g, "").length < 10) {
    marcar(campos.telefone, true);
    return mensagem(form, "Telefone incompleto.");
  }
  if (campos.senha.value.length < 6) {
    marcar(campos.senha, true);
    return mensagem(form, "A senha precisa ter pelo menos 6 caracteres.");
  }
  if (campos.senha.value !== campos.confirma.value) {
    marcar(campos.confirma, true);
    return mensagem(form, "As senhas não conferem.");
  }

  const lista = lerLista("voluntarios");
  const email = campos.email.value.trim().toLowerCase();
  if (lista.some(v => v.email === email)) {
    marcar(campos.email, true);
    return mensagem(form, "Este email já está cadastrado.");
  }

  lista.push({
    nome: campos.nome.value.trim(),
    email,
    cnpj: campos.cnpj.value,
    endereco: campos.endereco.value.trim(),
    telefone: campos.telefone.value,
    senha: campos.senha.value, // apenas demonstração — nunca guarde senhas assim em produção
  });
  salvarLista("voluntarios", lista);

  mensagem(form, "Cadastro realizado! Redirecionando para o login...", "sucesso");
  form.reset();
  setTimeout(() => { location.hash = "login-voluntario"; }, 1500);
});

// =====================================================
//  ESQUECI A SENHA
// =====================================================
const formEsqueci = $("form-esqueci");
const btnReenviar = $("btn-reenviar");
let emailRecuperacao = "";
let timer = null;

function enviarCodigo() {
  const email = $("rec-email");
  if (!emailValido(email.value)) {
    marcar(email, true);
    mensagem(formEsqueci, "Digite um email válido.");
    return false;
  }
  // Aqui entraria a chamada ao servidor que envia o email.
  emailRecuperacao = email.value.trim().toLowerCase();
  mensagem(formEsqueci, `Código enviado para ${email.value}`, "sucesso");
  iniciarContagem();
  return true;
}

function iniciarContagem() {
  let s = 30;
  btnReenviar.disabled = true;
  clearInterval(timer);
  btnReenviar.textContent = `Reenviar em ${s}s`;
  timer = setInterval(() => {
    s--;
    btnReenviar.textContent = `Reenviar em ${s}s`;
    if (s <= 0) {
      clearInterval(timer);
      btnReenviar.disabled = false;
      btnReenviar.textContent = "Reenviar Código";
    }
  }, 1000);
}

formEsqueci.addEventListener("submit", e => {
  e.preventDefault();
  if (enviarCodigo()) setTimeout(() => { location.hash = "trocar-senha"; }, 1200);
});
btnReenviar.addEventListener("click", enviarCodigo);

// =====================================================
//  TROCAR SENHA
// =====================================================
$("form-trocar").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const senha = $("nova-senha");
  const confirma = $("nova-confirma");

  if (senha.value.length < 6) {
    marcar(senha, true);
    return mensagem(form, "A senha precisa ter pelo menos 6 caracteres.");
  }
  if (senha.value !== confirma.value) {
    marcar(confirma, true);
    return mensagem(form, "As senhas não conferem.");
  }

  // atualiza a senha do voluntário que pediu a recuperação (se existir)
  const lista = lerLista("voluntarios");
  const usuario = lista.find(v => v.email === emailRecuperacao);
  if (usuario) {
    usuario.senha = senha.value;
    salvarLista("voluntarios", lista);
  }

  mensagem(form, "Senha alterada! Redirecionando...", "sucesso");
  form.reset();
  setTimeout(() => { location.hash = usuario ? "login-voluntario" : "inicio"; }, 1500);
});

// =====================================================
//  EM PRODUÇÃO
// =====================================================
function hoje() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Dados de exemplo: prazos relativos a hoje (dias a partir de hoje)
const PACIENTES = [
  ["Ana Lima",       "Prótese de dedo",      -4],
  ["Beatriz Rocha",  "Prótese de mão",       -1],
  ["João Pereira",   "Prótese de antebraço",  3],
  ["Maria Souza",    "Prótese de mão",       21],
  ["Lucas Oliveira", "Prótese de braço",     24],
  ["Carlos Mendes",  "Órtese de punho",      37],
].map(([nome, protese, dias]) => {
  const prazo = hoje();
  prazo.setDate(prazo.getDate() + dias);
  return { nome, protese, prazo };
});

let pacienteSelecionado = null;

function situacao(prazo) {
  const dias = Math.round((prazo - hoje()) / 86400000);
  if (dias < 0) return ["atrasado", `Atrasado ${-dias} ${dias === -1 ? "dia" : "dias"}`];
  if (dias === 0) return ["urgente", "Entrega hoje"];
  return [dias <= 7 ? "urgente" : "ok", dias === 1 ? "Falta 1 dia" : `Faltam ${dias} dias`];
}

function renderizarProducao() {
  const termo = normalizar($("prod-busca").value.trim());
  const lista = PACIENTES
    .filter(p => normalizar(p.nome + " " + p.protese).includes(termo))
    .sort((a, b) => a.prazo - b.prazo);

  $("prod-resumo").textContent =
    `${lista.length} ${lista.length === 1 ? "paciente" : "pacientes"} · ordenados pelo prazo mais próximo`;

  $("prod-lista").innerHTML = lista.length
    ? lista.map(p => {
        const [classe, texto] = situacao(p.prazo);
        const iniciais = p.nome.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
        return `
          <div class="linha ${pacienteSelecionado === p.nome ? "selecionada" : ""}" role="row" tabindex="0" data-nome="${esc(p.nome)}">
            <span class="cel-paciente"><span class="ini">${iniciais}</span><b>${esc(p.nome)}</b></span>
            <span>${esc(p.protese)}</span>
            <span>${p.prazo.toLocaleDateString("pt-BR")}</span>
            <span><em class="status ${classe}">${texto}</em></span>
          </div>`;
      }).join("")
    : `<p class="sem-resultado">Nenhum paciente encontrado.</p>`;
}

$("prod-busca").addEventListener("input", renderizarProducao);

function selecionarLinha(linha) {
  if (!linha) return;
  pacienteSelecionado = pacienteSelecionado === linha.dataset.nome ? null : linha.dataset.nome;
  renderizarProducao();
}
$("prod-lista").addEventListener("click", e => selecionarLinha(e.target.closest(".linha")));
$("prod-lista").addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selecionarLinha(e.target.closest(".linha")); }
});

// =====================================================
//  CADASTRAR IMPRESSORA (formulário em 4 etapas)
// =====================================================
const formImp = $("form-impressora");
const etapas = formImp.querySelectorAll(".etapa");
const passos = document.querySelectorAll("#etapas li");
const btnProximo = $("imp-proximo");
const btnVoltar = $("imp-voltar");
const ULTIMA = etapas.length - 1;
let etapaAtual = 0;
let maiorEtapa = 0;

const GRUPOS = [
  ["Identificação", { nome: "Nome", modelo: "Modelo", marca: "Marca", local: "Localização" }],
  ["Especificações", { tecnologia: "Tecnologia", area: "Área de impressão", bico: "Bico", velocidade: "Velocidade máxima" }],
  ["Filamento", { filamento: "Tipo", diametro: "Diâmetro", cor: "Cor", estoque: "Estoque" }],
];
const SUFIXOS = { area: " mm", velocidade: " mm/s", estoque: " kg" };

function irEtapa(n) {
  etapaAtual = n;
  maiorEtapa = Math.max(maiorEtapa, n);
  etapas.forEach((f, i) => (f.hidden = i !== n));
  passos.forEach((li, i) => {
    li.classList.toggle("ativa", i === n);
    li.classList.toggle("feita", i <= maiorEtapa && i !== n);
  });
  btnVoltar.hidden = n === 0;
  btnProximo.textContent = n === ULTIMA ? "Cadastrar impressora" : "Próximo →";
  if (n === ULTIMA) montarRevisao();
  mensagem(formImp, "");
}

function validarEtapa(n) {
  let valido = true;
  etapas[n].querySelectorAll("[required]").forEach(campo => {
    const vazio = !campo.value.trim();
    marcar(campo, vazio);
    campo.parentElement.querySelector(".erro-campo").textContent = vazio ? campo.dataset.erro : "";
    if (vazio && valido) { valido = false; campo.focus(); }
  });
  return valido;
}

function montarRevisao() {
  const dados = Object.fromEntries(new FormData(formImp));
  $("imp-revisao").innerHTML = GRUPOS.map(([titulo, campos], i) => `
    <div class="revisao-grupo">
      <h3>${titulo} <button type="button" data-editar="${i}">Editar</button></h3>
      <dl>${Object.entries(campos).map(([chave, rotulo]) => `
        <dt>${rotulo}</dt>
        <dd>${dados[chave] ? esc(dados[chave]) + (SUFIXOS[chave] || "") : "—"}</dd>`).join("")}
      </dl>
    </div>`).join("");
}

$("imp-revisao").addEventListener("click", e => {
  const b = e.target.closest("[data-editar]");
  if (b) irEtapa(Number(b.dataset.editar));
});

btnVoltar.addEventListener("click", () => irEtapa(etapaAtual - 1));

passos.forEach((li, i) => li.addEventListener("click", () => {
  if (i === etapaAtual || i > maiorEtapa) return;
  if (i < etapaAtual || validarEtapa(etapaAtual)) irEtapa(i);
}));

formImp.addEventListener("submit", e => {
  e.preventDefault();
  if (etapaAtual < ULTIMA) {
    if (validarEtapa(etapaAtual)) irEtapa(etapaAtual + 1);
    return;
  }

  // última etapa: confere tudo antes de salvar
  for (let i = 0; i < ULTIMA; i++) {
    if (!validarEtapa(i)) { irEtapa(i); validarEtapa(i); return; }
  }

  const lista = lerLista("impressoras");
  lista.push({ ...Object.fromEntries(new FormData(formImp)), cadastradaEm: new Date().toISOString() });
  salvarLista("impressoras", lista);

  mensagem(formImp, "Impressora cadastrada com sucesso!", "sucesso");
  btnProximo.disabled = true;
  setTimeout(() => {
    formImp.reset();
    maiorEtapa = 0;
    btnProximo.disabled = false;
    location.hash = "pagina-minhas-impressoras";
    irEtapa(0);
  }, 1500);
});

// =====================================================
//  INÍCIO
// =====================================================
window.addEventListener("hashchange", mostrarTela);
mostrarTela();