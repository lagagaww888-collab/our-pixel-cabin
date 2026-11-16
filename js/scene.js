const $ = s => document.querySelector(s),
  room = $('#room'),
  actor = $('#actor'),
  dialog = $('#modal'),
  body = $('#body');
const today = () => new Date().toLocaleDateString('sv-SE');
let lastStep = performance.now(),
  route = [],
  moodTimer;
let state = structuredClone(DEFAULTS),
  position = {
    x: 235,
    y: 190
  },
  target = null,
  keys = new Set(),
  direction = 'front',
  sleeping = false,
  near = null,
  last = 0;
document.querySelectorAll('[data-art]').forEach(i => i.src = ASSETS[i.dataset.art]);
const art = name => '<img alt="" src="' + ASSETS[name] + '">';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
const tapEnd = new Map();
function keyName(e) {
  if (/^Key[WASDE]$/.test(e.code)) return e.code.slice(-1).toLowerCase();
  return /^Numpad[1-5]$/.test(e.code) ? e.code.slice(-1) : e.key.toLowerCase();
}
const reactions = [
  [{translate:'0 -12px'}, {translate:'0 0'}, {translate:'0 -6px'}],
  [{rotate:'-5deg', scale:'.97'}, {rotate:'3deg', scale:'.98'}],
  [{translate:'0 -16px',scale:'1.04'}, {translate:'0 -5px'}],
  [{rotate:'-5deg'}, {rotate:'-5deg'}],
  [{translate:'-3px 2px'}, {translate:'3px 2px'}, {translate:'-2px 1px'}]
];
let reaction;
const emotions = [['happy', '开心'], ['shy', '害羞'], ['surprised', '惊喜'], ['thinking', '思考'], ['upset', '委屈']];
function showMood(index) {
  const [image, label] = emotions[index];
  lastStep = performance.now();
  reaction?.cancel();
  if (!sleeping && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reaction = actor.animate([{}, ...reactions[index], {}], {duration: 640, easing:'ease-in-out'});
  }
  $('#face').src = ASSETS[image];
  $('#emotion').textContent = label;
  $('#mood').hidden = false;
  clearTimeout(moodTimer);
  moodTimer = setTimeout(() => $('#mood').hidden = true, 3600);
}
for (const [name, x, y, w, h] of [['rug', 134, 141, 276, 105], ['shelf', 13, 15, 95, 122], ['tea', 270, 132, 76, 55], ['post', 108, 25, 59, 49], ['reading-chair', 9, 152, 91, 86], ['rilakkuma', ...BEAR.spot], ['bedside', 487, 67, 47, 81], ['plant-bench', 267, 107, 72, 40], ['gift', 482, 154, 41, 40], ['bed', 396, 75, 99, 92], ['desk', 122, 76, 74, 69], ['plant', 273, 87, 31, 32], ['music', 350, 145, 36, 37]]) {
  const img = document.createElement('img');
  img.src = ASSETS[name];
  img.id = 'prop-' + name;
  img.alt = '';
  Object.assign(img.style, {
    left: x / 5.6 + '%',
    top: y / 2.52 + '%',
    width: w / 5.6 + '%',
    height: h / 2.52 + '%'
  });
  $('#props').append(img);
}
for (const [id, label, x, y, w, h] of ITEMS) {
  const hot = document.createElement('button');
  hot.className = 'hot';
  hot.setAttribute('aria-label', label);
  Object.assign(hot.style, {
    left: x / 5.6 + '%',
    top: y / 2.52 + '%',
    width: w / 5.6 + '%',
    height: h / 2.52 + '%'
  });
  hot.onclick = () => openPanel(id);
  $('#hits').append(hot);
  const b = document.createElement('button');
  b.className = 'shortcut';
  b.innerHTML = art(id) + label;
  b.onclick = hot.onclick;
  $('#shortcuts').append(b);
}
for (const [prop, label, action] of [
  ['reading-chair', '翻开椅上的日记', () => openPanel('diary')],
  ['bedside', '切换床头灯', toggleTheme],
  ['rilakkuma', '与轻松熊互动', () => openPanel('bear')]
]) {
  const image = $('#prop-' + prop);
  const hit = document.createElement('button');
  hit.className = 'hot decor-hit';
  hit.setAttribute('aria-label', label);
  hit.style.cssText = image.style.cssText;
  hit.onclick = action;
  $('#hits').append(hit);
}
function refresh() {
  document.title = $('#brand').textContent = state.name || DEFAULTS.name;
  $('#welcome').textContent = state.welcome;
  $('#today').textContent = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  let night = state.theme === 'night';
  room.style.backgroundImage = 'url("' + ASSETS[night ? 'room-night' : 'room-day'] + '")';
  $('#theme').textContent = night ? '☾　星夜小屋　⌄' : '☀　晴日小屋　⌄';
  $('#friend').hidden = !state.companion;
  $('#growth').textContent = ['', '❧', '✿', '✿✿'][Math.min(3, state.water)];
  $('#prop-plant').style.transform = 'scale(' + [.65, .78, .91, 1][Math.min(3, state.water)] + ')';
  room.classList.toggle('asleep', sleeping);
}
function toggleTheme() {
  state.theme = state.theme === 'night' ? 'day' : 'night';
  sleeping = false;
  save();
  refresh();
}
$('#theme').onclick = toggleTheme;
function movePoint(e) {
  if (e.target.closest('button')) return;
  const r = room.getBoundingClientRect();
  target = {
    x: Math.max(12, Math.min(548, (e.clientX - r.left) * 560 / r.width)),
    y: Math.max(140, Math.min(249, (e.clientY - r.top) * 252 / r.height))
  };
  route = findRoute(position, target);
  target = route.shift() || null;
  room.focus();
}
room.addEventListener('click', movePoint);
const controls = ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', 'shift'];
window.onkeydown = e => {
  if (dialog.open || e.ctrlKey || e.altKey || e.metaKey) return;
  let k = keyName(e);
  if (/^[1-5]$/.test(k)) {
    e.preventDefault();
    if (!e.repeat) showMood(+k - 1);
    return;
  }
  if (controls.includes(k)) {
    e.preventDefault();
    if (!keys.has(k) && k !== 'shift') {
      // Apply the first footstep in the input event, even between two paint frames.
      const firstStep = keys.has('shift') ? 5 : 3;
      const horizontal = {a:-1, arrowleft:-1, d:1, arrowright:1}[k] || 0;
      const vertical = {w:-1, arrowup:-1, s:1, arrowdown:1}[k] || 0;
      const nextX = position.x + firstStep * horizontal;
      const nextY = position.y + firstStep * vertical;
      if (canStand(nextX, nextY)) {
        position.x = nextX;
        position.y = nextY;
      }
      lastStep = performance.now();
      direction = horizontal ? (horizontal > 0 ? 'right' : 'left') : (vertical > 0 ? 'front' : 'back');
      if (sleeping) { sleeping = false; refresh(); }
      for (const prior of tapEnd.keys()) if (!keys.has(prior)) tapEnd.delete(prior);
      tapEnd.set(k, performance.now() + 95);
    }
    keys.add(k);
    target = null;
    route = [];
  }
  if (k === 'escape' && document.documentElement.classList.contains('game-screen')) {
    e.preventDefault();
    if (!e.repeat) leaveGameScreen();
    return;
  }
  if ((k === 'e' || k === 'escape') && !e.repeat) {
    e.preventDefault();
    openPanel(k === 'e' && near ? near : 'menu');
  }
};
window.onkeyup = e => keys.delete(keyName(e));
function stopKeys() { keys.clear(); tapEnd.clear(); }
window.onblur = stopKeys;
document.addEventListener('visibilitychange', () => { if (document.hidden) stopKeys(); });
let stride = 0;
function tick(now) {
  const dt = Math.min((now - last) / 1000, .04);
  last = now;
  for (const [key, until] of tapEnd) if (until <= now) tapEnd.delete(key);
  const pressed = key => keys.has(key) || tapEnd.has(key);
  let dx = Number(pressed('d') || pressed('arrowright')) - Number(pressed('a') || pressed('arrowleft')),
    dy = Number(pressed('s') || pressed('arrowdown')) - Number(pressed('w') || pressed('arrowup'));
  if (target) {
    dx = target.x - position.x;
    dy = target.y - position.y;
  }
  let len = Math.hypot(dx, dy),
    moving = len > .4 && !dialog.open,
    run = keys.has('shift');
  if (moving) {
    lastStep = now;
    if (sleeping) {
      sleeping = false;
      refresh();
    }
    let step = (run ? 110 : 62) * dt;
    if (target) step = Math.min(step, len);
    let nx = Math.max(12, Math.min(548, position.x + dx / len * step)),
      ny = Math.max(140, Math.min(248, position.y + dy / len * step));
    if (canStand(nx, position.y)) position.x = nx;
    if (canStand(position.x, ny)) position.y = ny;
    direction = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'front' : 'back';
  } else if (!dialog.open) target = route.shift() || null;
  let resting = !moving && now - lastStep > 8500 && position.x > 165 && position.x < 370 && position.y > 163 && position.y < 215;
  let sprite = sleeping ? 'sleep' : resting ? 'sit' : direction,
    flip = false;
  if (moving && ['right', 'left'].includes(direction)) {
    sprite = run ? 'run' : 'walk';
    flip = run ? direction === 'left' : direction === 'right';
  }
  if (actor.getAttribute('src') !== ASSETS[sprite]) actor.src = ASSETS[sprite];
  actor.style.left = (sleeping ? 80 : position.x / 5.6) + '%';
  actor.style.top = (sleeping ? 64 : position.y / 2.52) + '%';
  actor.style.height = sleeping ? '33%' : resting ? '21%' : '27%';
  stride = moving ? stride + dt * (run ? 17 : 11) : 0;
  const swing = Math.sin(stride);
  const lift = Math.abs(swing) * (run ? 5 : 3);
  actor.style.transform = 'translate(-50%,-100%) translateY(' + -lift + 'px) rotate(' + (swing * 3) + 'deg) scaleX(' + (flip ? -1 : 1) + ')';
  $('#mood').style.left = actor.style.left;
  $('#mood').style.top = (sleeping ? 64 : position.y / 2.52) - (sleeping ? 33 : 27) + '%';
  updateVisitors(dt, now); actor.style.zIndex = Math.round(position.y); let closest = 27;
  near = null;
  let objects = [...ITEMS, ['bear', BEAR.name, ...BEAR.spot], ...visitors.map(v => ["npc-" + v.profile.id, v.profile.name, v.x-5,v.y,10,0])];
  for (const [id,, x, y, w, h] of objects) {
    let dist = Math.hypot(Math.max(x - position.x, 0, position.x - x - w), Math.abs(position.y - Math.max(140, y + h)));
    if (dist < closest || id.startsWith('npc-') && dist === closest && dist < 15) {
      closest = dist;
      near = id;
    }
  }
  $('#hint').textContent = near ? '按 E 互动 · ' + objects.find(i => i[0] === near)[1] : '';
  $('#status').textContent = sleeping ? '已入梦乡' : moving ? run ? '小跑中' : '散步中' : resting ? '地毯上小憩' : '自在闲逛';
  requestAnimationFrame(tick);
}
window.addEventListener('DOMContentLoaded', () => {
  room.focus({preventScroll:true});
  requestAnimationFrame(tick);
});
refresh();
document.addEventListener('error', e => {
  if (e.target.tagName === 'IMG') {
    e.target.alt = '素材未能载入';
    e.target.title = '请检查 assets 目录';
  }
}, true);




