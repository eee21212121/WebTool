const DATA_URL = './data/tools.json';
const STORAGE_KEY = 'tooldock:submissions';
const THEME_KEY = 'tooldock:theme';

const form = document.querySelector('#submitForm');
const categorySelect = document.querySelector('#categorySelect');
const submissionList = document.querySelector('#submissionList');
const copyQueue = document.querySelector('#copyQueue');
const clearQueue = document.querySelector('#clearQueue');

applyTheme();
init();

async function init() {
  await populateCategories();
  renderQueue();
  bindEvents();
}

async function populateCategories() {
  try {
    const response = await fetch(DATA_URL);
    const data = await response.json();
    categorySelect.innerHTML = data.categories.map((category) => `
      <option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>
    `).join('');
  } catch {
    categorySelect.innerHTML = `
      <option value="ai">AI 工具</option>
      <option value="developer">开发工程</option>
      <option value="design">设计创意</option>
      <option value="office">办公协作</option>
      <option value="data">数据处理</option>
      <option value="learning">学习资料</option>
    `;
  }
}

function bindEvents() {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const submission = {
      id: crypto.randomUUID(),
      name: data.get('name').trim(),
      url: normalizeUrl(data.get('url').trim()),
      category: data.get('category'),
      tags: splitTags(data.get('tags')),
      description: data.get('description').trim(),
      note: data.get('note').trim(),
      contact: data.get('contact').trim(),
      createdAt: new Date().toISOString()
    };

    const queue = readQueue();
    queue.unshift(submission);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    form.reset();
    renderQueue();
  });

  copyQueue.addEventListener('click', async () => {
    const queue = readQueue();
    await navigator.clipboard.writeText(JSON.stringify(queue, null, 2));
    copyQueue.classList.add('active');
    setTimeout(() => copyQueue.classList.remove('active'), 900);
  });

  clearQueue.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderQueue();
  });
}

function renderQueue() {
  const queue = readQueue();
  if (!queue.length) {
    submissionList.innerHTML = `
      <div class="empty-state">
        <strong>暂无提交</strong>
        <span>新的推荐会出现在这里。</span>
      </div>
    `;
    return;
  }

  submissionList.innerHTML = queue.map((item) => `
    <article class="submission-item">
      <strong>${escapeHtml(item.name)}</strong>
      <span>${escapeHtml(item.url)}</span>
      <span>${escapeHtml(item.description)}</span>
    </article>
  `).join('');
}

function normalizeUrl(url) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function splitTags(value) {
  return String(value)
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function applyTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = saved || (prefersDark ? 'dark' : 'light');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
