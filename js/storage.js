const storageKey = 'our-pixel-cabin-v1';
function toast(message) {
  const el = dialog.open ? $('#feedback') : $('#toast');
  if (!el) return;
  el.textContent = message;
  clearTimeout(el.timer);
  el.timer = setTimeout(() => el.textContent = '', 3800);
}
function validState(s) {
  if (!s || typeof s !== 'object') throw Error('设置格式无效');
  let merged = {
    ...structuredClone(DEFAULTS),
    ...s
  };
  for (const k of ['name', 'girl', 'boy', 'welcome', 'date']) if (typeof merged[k] !== 'string') throw Error('文字格式无效');
  for (const k of ['diary', 'mail', 'goals', 'notes', 'gifts']) if (!Array.isArray(merged[k]) || merged[k].some(v => !v || typeof v.id !== 'string' || typeof v.title !== 'string' || typeof v.body !== 'string')) throw Error('记录格式无效');
  if (!Number.isInteger(merged.water) || merged.water < 0 || !['day', 'night'].includes(merged.theme)) throw Error('房间设置无效');
  if (merged.welcome === '欢迎回家。灯亮着，小屋里的故事等你来写。') merged.welcome = DEFAULTS.welcome;
  return merged;
}
try {
  const raw = localStorage.getItem(storageKey);
  if (raw) state = validState(JSON.parse(raw));
} catch {
  toast('无法读取小屋数据，请检查浏览器存储或恢复备份。');
}
function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch {
    toast('保存失败，浏览器空间或权限不足。请导出备份。');
    return false;
  }
}
let database;
function db() {
  return database ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('our-pixel-cabin-media', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('files', {
      keyPath: 'id'
    });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      database = null;
      reject(req.error);
    };
  });
}
async function files(mode, action) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction('files', mode);
    const req = action(t.objectStore('files'));
    t.oncomplete = () => resolve(req?.result);
    t.onabort = t.onerror = () => reject(t.error || Error('存储操作失败'));
  });
}
const allMedia = () => files('readonly', s => s.getAll()),
  putMedia = v => files('readwrite', s => s.put(v)),
  removeMedia = id => files('readwrite', s => s.delete(id));
const uid = () => crypto.randomUUID();
function wire(id, fn) {
  const el = document.getElementById(id);
  el.onclick = async e => {
    if (el.disabled) return;
    el.disabled = true;
    try {
      await fn(e);
    } catch (err) {
      toast('操作失败：' + err.message);
    } finally {
      el.disabled = false;
    }
  };
}
