const ALLOWED_USERS = [
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
  { phone: '5521959520375', category: 'imersao1' }
];

const STORAGE_USER = 'rc_user';
const STORAGE_LIKE_PREFIX = 'rc_like_';

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
  return Boolean(loadUser());
}

function findAllowed(phone) {
  return ALLOWED_USERS.find(u => u.phone === phone) || null;
}

function canUseFirebase() {
  return window.firebase && window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && !String(window.FIREBASE_CONFIG.apiKey).startsWith('COLOQUE');
}

function getDb() {
  if (!canUseFirebase()) return null;
  if (!firebase.apps.length) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
  }
  return firebase.firestore();
}

async function persistUserProfile(user) {
  const db = getDb();
  if (!db) return false;
  try {
    await db.collection('users').doc(user.phone).set({
      phone: user.phone,
      name: user.name,
      category: user.category,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Falha ao salvar usuario', err);
    return false;
  }
}

(function gatekeeping() {
  const isLoginPage = document.body.classList.contains('page-login') || document.body.dataset.noGate === 'true';
  if (isLoginPage) return;
  if (!isLogged()) {
    window.location.replace('login.html');
  }
})();

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

// Login page logic (login.html)
if (document.body.classList.contains('page-login')) {
  const loginForm = document.getElementById('loginForm');
  const authStatus = document.getElementById('authStatus');
  if (isLogged()) {
    window.location.replace('index.html');
  }
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = loginForm.loginName?.value?.trim();
      const phoneRaw = loginForm.loginPhone?.value?.trim();
      const phone = sanitizePhone(phoneRaw);
      if (!name || !phone) {
        if (authStatus) authStatus.textContent = 'Preencha nome e telefone.';
        return;
      }
      const allowed = findAllowed(phone);
      if (!allowed) {
        if (authStatus) authStatus.textContent = 'Telefone nao autorizado.';
        return;
      }
      const user = { name, phone, category: allowed.category };
      const saved = await persistUserProfile(user);
      if (!saved) {
        if (authStatus) authStatus.textContent = 'Configure o FIREBASE_CONFIG para salvar.';
        return;
      }
      saveUser(user);
      if (authStatus) authStatus.textContent = 'Autorizado! Redirecionando...';
      window.location.replace('index.html');
    });
  }
}

// Watch page logic
if (document.body.classList.contains('page-watch')) {
  const mainVideo = document.getElementById('mainVideo');
  const watchTitle = document.querySelector('.watch-title');
  const likeBtn = document.getElementById('likeBtn');
  const commentForm = document.getElementById('commentForm');
  const commentInput = document.getElementById('commentInput');
  const commentStatus = document.getElementById('commentStatus');
  const lessonCards = Array.from(document.querySelectorAll('.lesson-card'));

  let currentUser = loadUser();
  let currentVideoId = 'captacao-clientes';
  let likedState = false;

  function updateLikeUI(state) {
    likedState = state;
    if (likeBtn) {
      likeBtn.setAttribute('aria-pressed', state ? 'true' : 'false');
      likeBtn.classList.toggle('active', state);
    }
  }

  function setLikeStored(videoId, state) {
    localStorage.setItem(`${STORAGE_LIKE_PREFIX}${videoId}`, state ? '1' : '0');
  }

  function getLikeStored(videoId) {
    return localStorage.getItem(`${STORAGE_LIKE_PREFIX}${videoId}`) === '1';
  }

  function setAuthMessage(msg) {
    if (commentStatus) commentStatus.textContent = msg;
  }

  function ensureLogged(actionMessage) {
    currentUser = loadUser();
    if (!currentUser) {
      setAuthMessage(actionMessage || 'Faca login para continuar.');
      window.location.replace('login.html');
      return false;
    }
    return true;
  }

  function enableActions(enabled) {
    if (likeBtn) likeBtn.disabled = !enabled;
    if (commentInput) commentInput.disabled = !enabled;
  }

  function handleLessonClick(card) {
    const available = card.dataset.available !== 'false';
    if (!available) return;
    lessonCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    const src = card.dataset.src;
    const poster = card.dataset.poster;
    const title = card.dataset.title || 'Video';
    const id = card.dataset.id || title.toLowerCase().replace(/\s+/g, '-');
    currentVideoId = id;
    if (mainVideo && src) {
      mainVideo.pause();
      const sourceEl = mainVideo.querySelector('source');
      if (sourceEl) sourceEl.setAttribute('src', src);
      if (poster) mainVideo.setAttribute('poster', poster);
      mainVideo.load();
    }
    if (watchTitle) {
      watchTitle.textContent = title;
      watchTitle.dataset.videoId = id;
    }
    updateLikeUI(getLikeStored(id));
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

  async function persistLike() {
    if (!currentUser) return;
    const db = getDb();
    if (!db) {
      setAuthMessage('Preencha FIREBASE_CONFIG para salvar o like.');
      return;
    }
    try {
      await db.collection('likes').doc(`${currentVideoId}-${currentUser.phone}`).set({
        videoId: currentVideoId,
        userName: currentUser.name,
        phone: currentUser.phone,
        category: currentUser.category,
        liked: likedState,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      setAuthMessage('Like registrado.');
    } catch (err) {
      console.error(err);
      setAuthMessage('Falha ao salvar like.');
    }
  }

  async function persistComment(text) {
    if (!currentUser) return;
    const db = getDb();
    if (!db) {
      if (commentStatus) commentStatus.textContent = 'Preencha FIREBASE_CONFIG para salvar comentarios.';
      return;
    }
    try {
      await db.collection('comments').add({
        videoId: currentVideoId,
        userName: currentUser.name,
        phone: currentUser.phone,
        category: currentUser.category,
        text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      if (commentStatus) commentStatus.textContent = 'Comentario enviado!';
    } catch (err) {
      console.error(err);
      if (commentStatus) commentStatus.textContent = 'Erro ao enviar comentario.';
    }
  }

  function updateAuthUI() {
    currentUser = loadUser();
    const logged = Boolean(currentUser);
    enableActions(logged);
    if (logged) {
      updateLikeUI(getLikeStored(currentVideoId));
    }
  }

  if (likeBtn) {
    likeBtn.addEventListener('click', async () => {
      if (!ensureLogged('Faca login para registrar like.')) return;
      likedState = !likedState;
      updateLikeUI(likedState);
      setLikeStored(currentVideoId, likedState);
      await persistLike();
    });
  }

  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!ensureLogged('Faca login para comentar.')) return;
      const text = commentInput?.value?.trim();
      if (!text) {
        if (commentStatus) commentStatus.textContent = 'Digite um comentario.';
        return;
      }
      await persistComment(text);
      if (commentInput) commentInput.value = '';
      setTimeout(() => { if (commentStatus) commentStatus.textContent = ''; }, 3000);
    });
  }

  initLessons();
  updateAuthUI();
}
