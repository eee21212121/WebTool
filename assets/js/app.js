const DATA_URL = './data/tools.json';
const STORAGE_KEYS = {
  favorites: 'tooldock:favorites',
  recent: 'tooldock:recent',
  theme: 'tooldock:theme',
  view: 'tooldock:view'
};

const state = {
  categories: [],
  tools: [],
  query: '',
  category: 'all',
  tag: 'all',
  view: localStorage.getItem(STORAGE_KEYS.view) || 'grid',
  favorites: new Set(readJson(STORAGE_KEYS.favorites, []))
};

const els = {
  body: document.body,
  categoryNav: document.querySelector('#categoryNav'),
  searchInput: document.querySelector('#searchInput'),
  tagFilters: document.querySelector('#tagFilters'),
  toolsArea: document.querySelector('#toolsArea'),
  featuredStrip: document.querySelector('#featuredStrip'),
  totalCount: document.querySelector('#totalCount'),
  categoryCount: document.querySelector('#categoryCount'),
  favoriteCount: document.querySelector('#favoriteCount'),
  themeToggle: document.querySelector('#themeToggle'),
  gridView: document.querySelector('#gridView'),
  listView: document.querySelector('#listView')
};

init();

async function init() {
  applyTheme();
  applyView();

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.categories = data.categories || [];
    state.tools = data.tools || [];
    renderAll();
    bindEvents();
  } catch (error) {
    els.toolsArea.innerHTML = `
      <div class="empty-state">
        <strong>资源数据加载失败</strong>
        <span>请确认当前页面通过本地服务器或 Vercel 访问。</span>
      </div>
    `;
    console.error(error);
  }
}

function bindEvents() {
  els.searchInput.addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderAll();
  });

  els.categoryNav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    renderAll();
  });

  document.querySelector('.filter-row').addEventListener('click', (event) => {
    const button = event.target.closest('[data-tag]');
    if (!button) return;
    state.tag = button.dataset.tag;
    renderAll();
  });

  els.toolsArea.addEventListener('click', (event) => {
    const favoriteButton = event.target.closest('[data-favorite]');
    if (favoriteButton) {
      toggleFavorite(favoriteButton.dataset.favorite);
      return;
    }

    const link = event.target.closest('[data-tool-link]');
    if (link) recordRecent(link.dataset.toolLink);
  });

  els.featuredStrip.addEventListener('click', (event) => {
    const link = event.target.closest('[data-tool-link]');
    if (link) recordRecent(link.dataset.toolLink);
  });

  els.themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEYS.theme, next);
    applyTheme();
  });

  els.gridView.addEventListener('click', () => setView('grid'));
  els.listView.addEventListener('click', () => setView('list'));
}

function renderAll() {
  renderCategories();
  renderTags();
  renderStats();
  renderFeatured();
  renderTools();
}

function renderCategories() {
  const counts = getCategoryCounts();
  const buttons = [
    categoryButton({ id: 'all', name: '全部资源', description: '完整工具库' }, state.tools.length),
    categoryButton({ id: 'favorites', name: '我的收藏', description: '本机保存' }, state.favorites.size),
    ...state.categories.map((category) => categoryButton(category, counts[category.id] || 0))
  ];
  els.categoryNav.innerHTML = buttons.join('');
}

function categoryButton(category, count) {
  const active = state.category === category.id ? 'active' : '';
  const accent = category.accent ? `style="--category-accent:${category.accent}"` : '';
  return `
    <button class="category-button ${active}" type="button" data-category="${escapeHtml(category.id)}" ${accent}>
      <span class="category-dot"></span>
      <span class="category-copy">
        <strong>${escapeHtml(category.name)}</strong>
        <small>${escapeHtml(category.description || '')}</small>
      </span>
      <span class="category-count">${count}</span>
    </button>
  `;
}

function renderTags() {
  const tags = new Map();
  state.tools.forEach((tool) => {
    tool.tags.forEach((tag) => tags.set(tag, (tags.get(tag) || 0) + 1));
  });

  els.tagFilters.innerHTML = Array.from(tags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag, count]) => `
      <button class="pill ${state.tag === tag ? 'active' : ''}" type="button" data-tag="${escapeHtml(tag)}">
        ${escapeHtml(tag)}
        <span>${count}</span>
      </button>
    `)
    .join('');

  const allButton = document.querySelector('[data-tag="all"]');
  allButton.classList.toggle('active', state.tag === 'all');
}

function renderStats() {
  els.totalCount.textContent = state.tools.length;
  els.categoryCount.textContent = state.categories.length;
  els.favoriteCount.textContent = state.favorites.size;
}

function renderFeatured() {
  const featured = state.tools.filter((tool) => tool.featured).slice(0, 5);
  els.featuredStrip.innerHTML = featured.map((tool) => `
    <a class="featured-card" href="${escapeAttribute(tool.url)}" target="_blank" rel="noopener noreferrer" data-tool-link="${escapeHtml(tool.id)}">
      <img src="${faviconUrl(tool.url)}" alt="" loading="lazy">
      <span>
        <strong>${escapeHtml(tool.name)}</strong>
        <small>${escapeHtml(getCategoryName(tool.category))}</small>
      </span>
      <svg class="icon" aria-hidden="true"><use href="#icon-arrow"></use></svg>
    </a>
  `).join('');
}

function renderTools() {
  const tools = getFilteredTools();
  els.toolsArea.classList.toggle('list-view', state.view === 'list');

  if (!tools.length) {
    els.toolsArea.innerHTML = `
      <div class="empty-state">
        <strong>没有匹配的资源</strong>
        <span>换一个关键词或分类试试。</span>
      </div>
    `;
    return;
  }

  if (state.category !== 'all') {
    const selectedCategory = state.categories.find((category) => category.id === state.category);
    const categoryIntro = selectedCategory ? categoryIntroBlock(selectedCategory, tools.length) : '';
    els.toolsArea.innerHTML = `
      ${categoryIntro}
      <div class="tool-grid">
        ${tools.map(toolCard).join('')}
      </div>
    `;
    return;
  }

  const categoryGroups = state.categories
    .map((category) => ({
      category,
      tools: tools.filter((tool) => tool.category === category.id)
    }))
    .filter((group) => group.tools.length);

  els.toolsArea.innerHTML = categoryGroups.map((group) => `
    <section class="tool-section" id="${escapeHtml(group.category.id)}">
      <div class="section-heading">
        <span class="category-dot" style="--category-accent:${group.category.accent}"></span>
        <div>
          <h2>${escapeHtml(group.category.name)}</h2>
          <p>${escapeHtml(group.category.description)}</p>
        </div>
        <span>${group.tools.length}</span>
      </div>
      ${categoryIntroBlock(group.category, group.tools.length)}
      <div class="tool-grid">
        ${group.tools.map(toolCard).join('')}
      </div>
    </section>
  `).join('');
}

function toolCard(tool) {
  const favorite = state.favorites.has(tool.id);
  const category = getCategoryName(tool.category);
  const tags = tool.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  const recommendation = tool.recommendation
    ? `<div class="tool-reason"><strong>推荐理由</strong><span>${escapeHtml(tool.recommendation)}</span></div>`
    : '';
  const detailLink = tool.detailPath
    ? `<a class="icon-button" href="${escapeAttribute(tool.detailPath)}" aria-label="查看 ${escapeAttribute(tool.name)} 详情">
          <svg class="icon" aria-hidden="true"><use href="#icon-bookmark"></use></svg>
        </a>`
    : '';

  return `
    <article class="tool-card">
      <div class="tool-main">
        <img class="tool-icon" src="${faviconUrl(tool.url)}" alt="" loading="lazy">
        <div class="tool-copy">
          <div class="tool-title-row">
            <h3>${escapeHtml(tool.name)}</h3>
            <span class="tool-category">${escapeHtml(category)}</span>
          </div>
          <p>${escapeHtml(tool.description)}</p>
          ${recommendation}
          <div class="tool-tags">${tags}</div>
        </div>
      </div>
      <div class="tool-actions">
        ${detailLink}
        <button class="icon-button favorite-button ${favorite ? 'active' : ''}" type="button" aria-label="收藏 ${escapeAttribute(tool.name)}" data-favorite="${escapeHtml(tool.id)}">
          <svg class="icon" aria-hidden="true"><use href="#icon-star"></use></svg>
        </button>
        <a class="icon-button" href="${escapeAttribute(tool.url)}" target="_blank" rel="noopener noreferrer" aria-label="打开 ${escapeAttribute(tool.name)}" data-tool-link="${escapeHtml(tool.id)}">
          <svg class="icon" aria-hidden="true"><use href="#icon-external"></use></svg>
        </a>
      </div>
    </article>
  `;
}

function categoryIntroBlock(category, count) {
  if (!category?.longDescription && !category?.bestFor) return '';
  const bestFor = category.bestFor?.length
    ? `<div class="category-best-for">${category.bestFor.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>`
    : '';
  return `
    <div class="category-intro">
      <div>
        <strong>${escapeHtml(category.name)}怎么选</strong>
        <p>${escapeHtml(category.longDescription || category.description || '')}</p>
      </div>
      <div class="category-intro-meta">
        <span>${count} 个资源</span>
        ${bestFor}
      </div>
    </div>
  `;
}

function getFilteredTools() {
  return state.tools.filter((tool) => {
    const inCategory = state.category === 'all'
      || (state.category === 'favorites' && state.favorites.has(tool.id))
      || tool.category === state.category;
    const inTag = state.tag === 'all' || tool.tags.includes(state.tag);
    const haystack = [
      tool.name,
      tool.description,
      tool.recommendation || '',
      getCategoryName(tool.category),
      ...tool.tags
    ].join(' ').toLowerCase();
    const inQuery = !state.query || haystack.includes(state.query);
    return inCategory && inTag && inQuery;
  });
}

function getCategoryCounts() {
  return state.tools.reduce((counts, tool) => {
    counts[tool.category] = (counts[tool.category] || 0) + 1;
    return counts;
  }, {});
}

function getCategoryName(id) {
  return state.categories.find((category) => category.id === id)?.name || id;
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([...state.favorites]));
  renderAll();
}

function recordRecent(id) {
  const recent = readJson(STORAGE_KEYS.recent, []).filter((item) => item !== id);
  recent.unshift(id);
  localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(recent.slice(0, 12)));
}

function setView(view) {
  state.view = view;
  localStorage.setItem(STORAGE_KEYS.view, view);
  applyView();
  renderTools();
}

function applyView() {
  els.gridView?.classList.toggle('active', state.view === 'grid');
  els.listView?.classList.toggle('active', state.view === 'list');
}

function applyTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
}

function faviconUrl(url) {
  const domain = new URL(url).hostname;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
