const STORAGE_USER = 'rc_user';
const STORAGE_LIKE_PREFIX = 'rc_like_';
const API_BASE = '';

function sanitizePhone(value) {
  return (value || '').replace(/\D/g, '');
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
  return {
    user: { name, phone, category: 'local' },
    token: 'local-session-token',
  };
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
  { id: 'captacao-clientes', title: 'Captacao de Clientes', category: 'Trafego pago', keywords: 'ads conversao audiencia', available: true, href: 'watch.html?video=captacao-clientes' },
  { id: 'creatives', title: 'Creatives que convertem', category: 'Trafego pago', keywords: 'criativos criativo teste video', available: false },
  { id: 'metricas', title: 'Metricas e escala', category: 'Trafego pago', keywords: 'cpa roas ltv dados', available: false },
  { id: 'roteiro', title: 'Roteiro de qualificacao', category: 'Processo de vendas', keywords: 'lead scoring roteiro atendimento', available: false },
  { id: 'follow-up', title: 'Follow-up que fecha', category: 'Processo de vendas', keywords: 'follow up followup pipeline', available: false },
  { id: 'pitch', title: 'Pitch com provas', category: 'Processo de vendas', keywords: 'pitch proposta demo provas', available: false },
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
