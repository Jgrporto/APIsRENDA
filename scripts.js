const STORAGE_USER = 'rc_user';
const STORAGE_LIKE_PREFIX = 'rc_like_';
const API_BASE = '';
const OWNER_WHATSAPP = '5524992585486';
const STORAGE_NAME_MAP = 'rc_name_map';

// Telefones autorizados com categoria (imersao1).
const AUTHORIZED_USERS = [
  { phone: '556291817556', category: 'imersao1' },
  { phone: '5527988159986', category: 'imersao1' },
  { phone: '5521965277249', category: 'imersao1' },
  { phone: '5511957868500', category: 'imersao1' },
  { phone: '558597492473', category: 'imersao1' },
  { phone: '555481349932', category: 'imersao1' },
  { phone: '557588691415', category: 'imersao1' },
  { phone: '558197025272', category: 'imersao1' },
  { phone: '556299865952', category: 'imersao1' },
  { phone: '553185936438', category: 'imersao1' },
  { phone: '557192402099', category: 'imersao1' },
  { phone: '558198286078', category: 'imersao1' },
  { phone: '5511984046177', category: 'imersao1' },
  { phone: '553197133255', category: 'imersao1' },
  { phone: '555183412500', category: 'imersao1' },
  { phone: '557183192338', category: 'imersao1' },
  { phone: '553171526961', category: 'imersao1' },
  { phone: '5524981824259', category: 'imersao1' },
  { phone: '554197656857', category: 'imersao1' },
  { phone: '553299544923', category: 'imersao1' },
  { phone: '555198553204', category: 'imersao1' },
  { phone: '5519971463920', category: 'imersao1' },
  { phone: '553194371680', category: 'imersao1' },
  { phone: '556993186232', category: 'imersao1' },
  { phone: '553191867157', category: 'imersao1' },
  { phone: '555592241771', category: 'imersao1' },
  { phone: '5524992585486', category: 'imersao1' },
  { phone: '5521968986505', category: 'imersao1' },
  { phone: '5511984662320', category: 'imersao1' },
  { phone: '5512996052271', category: 'imersao1' },
  { phone: '558393515764', category: 'imersao1' },
  { phone: '554688323216', category: 'imersao1' },
  { phone: '557192979443', category: 'imersao1' },
  { phone: '557799306262', category: 'imersao1' },
  { phone: '5521995964831', category: 'imersao1' },
  { phone: '558898058046', category: 'imersao1' },
  { phone: '5511961458686', category: 'imersao1' },
  { phone: '5511917477678', category: 'imersao1' },
  { phone: '553199138178', category: 'imersao1' },
  { phone: '5524992910708', category: 'imersao1' },
  { phone: '5524992478084', category: 'imersao1' },
  { phone: '5524999157259', category: 'imersao1' },
  { phone: '5521959520375', category: 'imersao1' },
];
const AUTHORIZED_SET = new Set(AUTHORIZED_USERS.map(u => u.phone));

function sanitizePhone(value) {
  return (value || '').replace(/\D/g, '');
}

function normalizePhone(value) {
  const digits = sanitizePhone(value);
  if (digits.length === 11) return `55${digits}`;
  return digits;
}

function findAuthorizedUser(value) {
  const normalized = normalizePhone(value);
  return AUTHORIZED_USERS.find(u => u.phone === normalized) || null;
}

function loadUser() {
  try {
    const saved = localStorage.getItem(STORAGE_USER);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.warn('Falha ao carregar usuario', err);
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem(STORAGE_USER);
}

function isLogged() {
  const user = loadUser();
  return Boolean(user && user.token);
}

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error('Nao foi possivel conectar ao servidor.');
  }
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }
  if (!res.ok) {
    const message = data?.error || 'Erro ao comunicar com o servidor.';
    throw new Error(message);
  }
  return data || {};
}

// Front-only fallback: gera um token local ficticio (sem backend).
function createLocalSession(name, phone) {
  const normalized = normalizePhone(phone);
  const allowed = findAuthorizedUser(normalized);
  return {
    user: { name, phone: normalized, category: allowed?.category || 'local' },
    token: `local-session-token-${normalized}-${Date.now()}`,
  };
}

function enforceAuthGate() {
  const body = document.body;
  if (!body || body.dataset.noGate === 'true') return;
  if (!isLogged()) {
    window.location.href = 'index.html';
  }
}

function loadNameMap() {
  try {
    const raw = localStorage.getItem(STORAGE_NAME_MAP);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Falha ao carregar nomes salvos', err);
    return {};
  }
}

function saveKnownName(phone, name) {
  const map = loadNameMap();
  map[phone] = name;
  localStorage.setItem(STORAGE_NAME_MAP, JSON.stringify(map));
}

// Envio opcional para Google Sheets via webhook (definir SHEETS_WEBHOOK_URL no window).
function recordLoginEvent(name, phone, category) {
  saveKnownName(phone, name);
  const webhook = window?.SHEETS_WEBHOOK_URL;
  if (!webhook) {
    console.warn('Webhook do Sheets nao configurado.');
    return Promise.resolve({ skipped: true });
  }
  const payload = { name, phone, category, ts: new Date().toISOString() };
  console.info('Enviando login para Sheets', { webhook, payload });
  // Usa no-cors e sem headers customizados para evitar preflight OPTIONS (Apps Script retorna 405 em OPTIONS).
  return fetch(webhook, {
    method: 'POST',
    body: JSON.stringify(payload),
    mode: 'no-cors',
  }).then((res) => {
    console.info('Webhook Sheets enviado (resposta opaca por no-cors)', res);
    return res;
  }).catch((err) => {
    console.error('Falha ao registrar no Sheets', err);
    throw err;
  });
}

const searchBtn = document.querySelector('.search-btn');
const searchModal = document.getElementById('searchModal');
const searchInput = document.getElementById('searchInput');
const results = document.getElementById('results');
const closeSearchBtn = document.querySelector('.close-search');
const burgerBtn = document.querySelector('.burger');
const drawer = document.getElementById('drawer');
const closeDrawerBtn = document.querySelector('.close-drawer');

const FALLBACK_MENTORIAS = [
  { id: 'apresentacao-imersao', title: 'Apresentacao da Imersao - Como eu comecei', category: 'Imersao Renda com TV', keywords: 'apresentacao inicio jornada', available: true, href: 'watch.html?video=apresentacao-imersao' },
  { id: 'captacao-clientes', title: 'Aula 02 - Captacao de Clientes', category: 'Imersao Renda com TV', keywords: 'captacao clientes lead', available: true, href: 'watch.html?video=captacao-clientes' },
  { id: 'trafego-pago-subnicho', title: 'Aula 03 - Trafego pago para subnicho', category: 'Imersao Renda com TV', keywords: 'trafego pago subnicho', available: true, href: 'watch.html?video=trafego-pago-subnicho' },
  { id: 'analise-conta-anuncios', title: 'Aula 04 - Analise da conta de anuncios', category: 'Imersao Renda com TV', keywords: 'analise conta anuncios', available: true, href: 'watch.html?video=analise-conta-anuncios' },
  { id: 'trafego-whatsapp', title: 'Aula 05 - Porque o trafego para WhatsApp', category: 'Imersao Renda com TV', keywords: 'trafego whatsapp', available: true, href: 'watch.html?video=trafego-whatsapp' },
  { id: 'finalizacao-perguntas-respostas', title: 'Finalizacao - Perguntas e respostas', category: 'Imersao Renda com TV', keywords: 'finalizacao perguntas respostas', available: true, href: 'watch.html?video=finalizacao-perguntas-respostas' },
];

function collectCardData() {
  return Array.from(document.querySelectorAll('.mentoria-card')).map(card => {
    const title = (card.dataset.title || card.querySelector('h3')?.textContent || '').trim();
    const category = (card.dataset.category || '').trim();
    const keywords = (card.dataset.keywords || '').trim();
    const id = card.dataset.id || title.toLowerCase().replace(/\s+/g, '-');
    const available = card.dataset.available !== 'false';
    const overlayLink = card.querySelector('.card-overlay');
    const href = overlayLink && overlayLink.getAttribute('href') ? overlayLink.getAttribute('href') : (available ? `watch.html?video=${id}` : null);
    return {
      id,
      title,
      category,
      keywords,
      available,
      href,
      element: card,
    };
  });
}

let cards = collectCardData();
const searchData = cards.length ? cards : FALLBACK_MENTORIAS;

function toggleModal(show) {
  if (!searchModal || !searchInput) return;
  searchModal.setAttribute('aria-hidden', show ? 'false' : 'true');
  searchModal.hidden = !show;
  document.body.style.overflow = show ? 'hidden' : '';
  if (show) {
    searchInput.focus();
    renderResults('');
  } else {
    clearHighlights();
    searchInput.value = '';
  }
}

function toggleDrawer(show) {
  if (!drawer) return;
  drawer.setAttribute('aria-hidden', show ? 'false' : 'true');
  drawer.hidden = !show;
  document.body.style.overflow = show ? 'hidden' : '';
  if (burgerBtn) burgerBtn.setAttribute('aria-expanded', show ? 'true' : 'false');
}

function clearHighlights() {
  cards.forEach(({ element }) => element?.classList.remove('matched'));
}

function renderResults(term) {
  if (!results) return;
  const query = term.trim().toLowerCase();
  clearHighlights();

  if (!query) {
    results.innerHTML = '<p class="muted">Digite para encontrar rapidamente.</p>';
    return;
  }

  const matches = searchData.filter(({ title = '', category = '', keywords = '' }) => {
    const haystack = `${title} ${category} ${keywords}`.toLowerCase();
    return haystack.includes(query);
  });

  if (!matches.length) {
    results.innerHTML = '<p class="muted">Nenhum resultado encontrado. Tente outra palavra.</p>';
    return;
  }

  const list = matches.map(item => {
    const tag = item.category || 'Mentoria';
    const disabled = item.available === false;
    const label = item.title;
    return `<div class="result-item${disabled ? ' disabled' : ''}" data-id="${item.id}" data-href="${item.href || ''}" data-available="${disabled ? 'false' : 'true'}"><div>${label}</div><span class="tag">${tag}</span></div>`;
  }).join('');

  results.innerHTML = list;

  results.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', () => {
      const available = item.dataset.available !== 'false';
      if (!available) {
        item.classList.add('muted');
        return;
      }

      const targetId = item.dataset.id;
      const match = searchData.find(data => data.id === targetId);
      if (match?.element) {
        toggleModal(false);
        match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        match.element.classList.add('matched');
        setTimeout(() => match.element.classList.remove('matched'), 1500);
      } else if (match?.href) {
        window.location.href = match.href;
      } else {
        window.location.href = `watch.html?video=${targetId}`;
      }
    });
  });
}

if (searchBtn && searchModal && searchInput && results) {
  searchBtn.addEventListener('click', () => toggleModal(true));
  if (closeSearchBtn) closeSearchBtn.addEventListener('click', () => toggleModal(false));
  searchModal.addEventListener('click', (e) => { if (e.target === searchModal) toggleModal(false); });
  searchInput.addEventListener('input', (e) => renderResults(e.target.value));
} else if (searchBtn) {
  searchBtn.addEventListener('click', () => { window.location.href = 'Mentoria.html'; });
}

if (burgerBtn && drawer) {
  burgerBtn.addEventListener('click', () => toggleDrawer(true));
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => toggleDrawer(false));
  drawer.addEventListener('click', (e) => { if (e.target === drawer) toggleDrawer(false); });
  drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggleDrawer(false)));
}

Array.from(document.querySelectorAll('a[href^="#"]')).forEach(link => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

if (document.body.classList.contains('page-mentoria')) {
  window.addEventListener('load', () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  });
}

// Watch page logic (simplificado, sem login/likes/comentarios)
if (document.body.classList.contains('page-watch')) {
  const mainVideo = document.getElementById('mainVideo');
  const watchTitle = document.querySelector('.watch-title');
  const lessonCards = Array.from(document.querySelectorAll('.lesson-card'));

  let currentVideoId = 'apresentacao-imersao';

  function handleLessonClick(card) {
    const available = card.dataset.available !== 'false';
    if (!available) return;
    lessonCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    const src = card.dataset.src;
    const title = card.dataset.title || 'Video';
    const id = card.dataset.id || title.toLowerCase().replace(/\s+/g, '-');
    currentVideoId = id;
    if (mainVideo && src) {
      mainVideo.setAttribute('src', src);
    }
    if (watchTitle) {
      watchTitle.textContent = title;
      watchTitle.dataset.videoId = id;
    }
  }

  function initLessons() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('video');
    const preferred = lessonCards.find(card => (card.dataset.id || '') === requested && card.dataset.available !== 'false');
    const fallback = lessonCards.find(card => card.dataset.available !== 'false');
    const startCard = preferred || fallback;
    if (startCard) {
      handleLessonClick(startCard);
    }
    lessonCards.forEach(card => {
      card.addEventListener('click', () => handleLessonClick(card));
    });
  }

  initLessons();
}

function initLoginForm() {
  const form = document.getElementById('gateForm');
  if (!form) return;

  const nameInput = document.getElementById('loginName');
  const phoneInput = document.getElementById('loginPhone');
  const statusEl = document.getElementById('authStatus');
  const contactLink = document.getElementById('contactOwner');

  if (contactLink) {
    contactLink.href = `https://wa.me/${OWNER_WHATSAPP}`;
  }

  if (isLogged()) {
    window.location.href = 'home.html';
    return;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (nameInput?.value || '').trim();
    const phone = phoneInput?.value || '';

    if (!name || !phone) {
      if (statusEl) statusEl.textContent = 'Informe nome e telefone para continuar.';
      return;
    }

    const allowed = findAuthorizedUser(phone);
    if (!allowed) {
      if (statusEl) statusEl.textContent = 'Telefone nao autorizado. Fale com o dono no WhatsApp.';
      if (contactLink) contactLink.focus();
      return;
    }

    const session = createLocalSession(name, phone);
    saveUser(session);
    saveKnownName(session.user.phone, name);
    if (statusEl) statusEl.textContent = 'Acesso liberado! Registrando na planilha...';

    recordLoginEvent(name, session.user.phone, allowed.category)
      .then(() => {
        if (statusEl) statusEl.textContent = 'Acesso liberado! Redirecionando...';
      })
      .catch(() => {
        if (statusEl) statusEl.textContent = 'Acesso liberado, mas nao registrou na planilha. Veja console.';
      })
      .finally(() => {
        setTimeout(() => { window.location.href = 'home.html'; }, 300);
      });
  });
}

enforceAuthGate();
initLoginForm();
