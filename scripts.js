const searchBtn = document.querySelector('.search-btn');
const searchModal = document.getElementById('searchModal');
const searchInput = document.getElementById('searchInput');
const results = document.getElementById('results');
const closeSearchBtn = document.querySelector('.close-search');
const burgerBtn = document.querySelector('.burger');
const drawer = document.getElementById('drawer');
const closeDrawerBtn = document.querySelector('.close-drawer');

const cards = Array.from(document.querySelectorAll('.mentoria-card')).map(card => ({
  title: card.dataset.title.toLowerCase(),
  category: card.dataset.category.toLowerCase(),
  keywords: (card.dataset.keywords || '').toLowerCase(),
  element: card,
}));

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
}

function clearHighlights() {
  cards.forEach(({ element }) => element.classList.remove('matched'));
}

function renderResults(term) {
  if (!results) return;
  const query = term.trim().toLowerCase();
  clearHighlights();

  if (!query) {
    results.innerHTML = '<p class="muted">Digite para encontrar rapidamente.</p>';
    return;
  }

  const matches = cards.filter(({ title, category, keywords, element }) => {
    const haystack = `${title} ${category} ${keywords}`;
    const hit = haystack.includes(query);
    if (hit) element.classList.add('matched');
    return hit;
  });

  if (!matches.length) {
    results.innerHTML = '<p class="muted">Nenhum resultado encontrado. Tente outra palavra.</p>';
    return;
  }

  const list = matches.map(({ element }) => {
    const label = element.dataset.title;
    const tag = element.dataset.category;
    return `<div class="result-item" data-target="${element.dataset.title}"><div>${label}</div><span class="tag">${tag}</span></div>`;
  }).join('');

  results.innerHTML = list;

  results.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetTitle = item.dataset.target;
      const match = cards.find(({ element }) => element.dataset.title === targetTitle);
      if (match) {
        toggleModal(false);
        match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        match.element.classList.add('matched');
        setTimeout(() => match.element.classList.remove('matched'), 1500);
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
