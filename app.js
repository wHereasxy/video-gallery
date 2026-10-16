const root = document.getElementById('rabbit-doodle');
const grid = root.querySelector('.dd-grid');
const detail = document.getElementById('dd-view');
const player = document.getElementById('dd-player');
let works = [];
let filter = 'all';
let previousFocus;
const support = document.getElementById('dd-support');
const supportButton = element('button', 'dd-button dd-support-link cursor-interaction', '♡ 打赏作者');
supportButton.type = 'button';
supportButton.dataset.support = '';
root.querySelector('.dd-socials').append(supportButton);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderWorks() {
  grid.replaceChildren();
  works.forEach((work, index) => {
    if (filter !== 'all' && work.category !== filter) return;
    const card = element('article', 'dd-card');
    card.dataset.category = work.category;
    const tape = element('span', 'dd-card-tape');
    tape.setAttribute('aria-hidden', 'true');
    const thumb = element('button', 'dd-thumb cursor-interaction');
    thumb.type = 'button';
    thumb.dataset.work = work.id;
    thumb.setAttribute('aria-label', '观看' + work.title);
    const img = element('img');
    img.src = work.poster;
    img.alt = work.title + '封面';
    img.loading = 'lazy';
    const play = element('span', 'dd-thumb-play', '▶');
    play.setAttribute('aria-hidden', 'true');
    thumb.append(img, play);
    const body = element('div', 'dd-card-body');
    const meta = element('div', 'dd-meta');
    meta.append(element('span', '', String(index + 1).padStart(2, '0') + ' / ' + work.categoryName), element('span', 'dd-mark', work.tag));
    const button = element('button', 'dd-text-link cursor-interaction', '观看与下载 ↗');
    button.type = 'button';
    button.dataset.work = work.id;
    body.append(meta, element('h3', '', work.title), element('p', '', work.description), button);
    card.append(tape, thumb, body);
    grid.append(card);
  });
  root.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
}

function showWork(id, scroll = true) {
  const work = works.find(item => item.id === id);
  if (!work) return;
  previousFocus = document.activeElement;
  player.pause();
  document.getElementById('dd-playback-error').hidden = true;
  detail.hidden = false;
  detail.querySelector('[data-detail-title]').textContent = work.title;
  player.poster = work.poster;
  player.src = work.video;
  player.load();
  document.getElementById('dd-description').textContent = work.description;
  const download = document.getElementById('dd-download');
  download.href = work.video;
  download.download = work.downloadName;
  document.getElementById('dd-download-meta').textContent = 'MP4 · ' + (work.sizeMB || '—') + ' MB · ' + (work.durationLabel || '');
  document.title = work.title + ' · 小兔叽勇者';
  if (scroll) detail.scrollIntoView({block: 'start', behavior: 'auto'});
}

root.addEventListener('click', event => {
  if (event.target.closest('[data-support]')) support.showModal();
  const open = event.target.closest('[data-work]');
  if (open) {
    const id = open.dataset.work;
    if (!works.some(work => work.id === id)) return;
    history.replaceState(null, '', '#work=' + encodeURIComponent(id));
    showWork(id);
  }
  const choice = event.target.closest('[data-filter]');
  if (choice) { filter = choice.dataset.filter; renderWorks(); }
  const scroll = event.target.closest('[data-scroll]');
  if (scroll) document.getElementById('dd-' + scroll.dataset.scroll).scrollIntoView({block: 'start'});
  if (event.target.closest('[data-close]')) {
    player.pause();
    player.removeAttribute('src');
    player.load();
    detail.hidden = true;
    history.replaceState(null, '', location.pathname + location.search);
    document.title = '小兔叽勇者 · 作品集';
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll: true});
  }
  if (event.target.closest('[data-top]')) { event.preventDefault(); root.scrollIntoView({block: 'start'}); }
});
support.addEventListener('click', event => { if (event.target === support && (event.clientX < support.getBoundingClientRect().left || event.clientX > support.getBoundingClientRect().right || event.clientY < support.getBoundingClientRect().top || event.clientY > support.getBoundingClientRect().bottom)) support.close(); });
player.addEventListener('error', () => { if (player.getAttribute('src')) document.getElementById('dd-playback-error').hidden = false; });
window.addEventListener('hashchange', () => {
  if (location.hash.startsWith('#work=')) showWork(decodeURIComponent(location.hash.slice(6)));
});
fetch('works.json').then(response => {
  if (!response.ok) throw new Error('作品列表加载失败');
  return response.json();
}).then(data => {
  works = data;
  document.getElementById('dd-count').textContent = works.length;
  root.querySelector('.dd-feature').dataset.work = works[0]?.id || '';
  renderWorks();
  if (location.hash.startsWith('#work=')) showWork(decodeURIComponent(location.hash.slice(6)));
}).catch(() => { grid.replaceChildren(element('p', 'dd-error', '作品暂时无法加载，请刷新重试。')); });
