function settings() {
  panel('小屋设置', field('cname', '小屋名称', state.name) + field('cg', '女朋友昵称', state.girl) + field('cb', '男朋友昵称', state.boy) + field('cd', '纪念日', state.date, 'date') + field('cw', '欢迎语', state.welcome, 'area') + '<label>窗外风景<select id="ct"><option value="day">晴日</option><option value="night">星夜</option></select></label><label><span><input type="checkbox" id="cp"> 显示男主占位角色</span></label>' + btn('cs', '保存设置', true) + '<div class="row">' + btn('configure', '编辑礼物') + btn('letters', '编辑信件') + '</div><hr><h2>小屋备份</h2><p class="muted">备份包含私人文字、照片和本地音频，请妥善保管。</p>' + btn('export', '导出完整备份') + '<label>从备份恢复<input id="import" type="file" accept=".json,application/json"></label>' + btn('clear', '清空小屋数据'));
  $('#ct').value = state.theme;
  $('#cp').checked = state.companion;
  wire('cs', () => {
    Object.assign(state, {
      name: val('cname') || DEFAULTS.name,
      girl: val('cg'),
      boy: val('cb'),
      date: val('cd'),
      welcome: val('cw'),
      theme: val('ct'),
      companion: $('#cp').checked
    });
    if (save()) {
      refresh();
      toast('设置已保存');
    }
  });
  wire('configure', giftSettings);
  wire('letters', () => recordList('mail'));
  wire('export', exportBackup);
  $('#import').onchange = async e => {
    try {
      if (e.target.files[0]) await importBackup(e.target.files[0]);
    } catch (err) {
      toast('无法恢复备份：' + err.message);
    }
    e.target.value = '';
  };
  wire('clear', async () => {
    if (confirm('准备清空本浏览器中的全部小屋数据？') && confirm('再次确认：照片、音频和文字都将被清除。继续吗？')) await replaceData(structuredClone(DEFAULTS), []);
  });
}
function giftSettings() {
  panel('编辑礼物', state.gifts.map((g, i) => '<section class="sheet">' + field('gt' + i, '礼物名称', g.title) + field('gb' + i, '专属留言', g.body, 'area') + '<div class="row">' + btn('gs' + i, '保存') + btn('gd' + i, '删除') + '</div></section>').join('') + btn('ga', '添加占位礼物'));
  state.gifts.forEach((g, i) => {
    wire('gs' + i, () => {
      g.title = val('gt' + i);
      g.body = val('gb' + i);
      if (save()) toast('礼物已保存');
    });
    wire('gd' + i, () => {
      if (confirm('删除这份礼物？')) {
        state.gifts.splice(i, 1);
        save();
        giftSettings();
      }
    });
  });
  wire('ga', () => {
    state.gifts.push({
      id: uid(),
      title: '待填写的礼物',
      body: '待填写的留言',
      opened: false
    });
    save();
    giftSettings();
  });
}
function dataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
async function exportBackup() {
  const media = [];
  for (const {
    blob,
    ...meta
  } of await allMedia()) media.push({
    ...meta,
    data: await dataUrl(blob)
  });
  const blob = new Blob([JSON.stringify({
    format: 'pixel-cabin-1',
    state,
    media
  })], {
    type: 'application/json'
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '小屋备份-' + today() + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
async function importBackup(file) {
  const b = JSON.parse(await file.text());
  if (b.format !== 'pixel-cabin-1' || !Array.isArray(b.media)) throw Error('备份格式无效');
  const next = validState(b.state);
  const media = [],
    ids = new Set();
  for (const {
    data,
    ...m
  } of b.media) {
    if (typeof m.id !== 'string' || ids.has(m.id) || typeof data !== 'string' || typeof m.title !== 'string') throw Error('媒体记录无效');
    ids.add(m.id);
    const match = /^data:([a-z0-9.+/-]+);base64,([a-z0-9+/=]*)$/i.exec(data);
    if (!match) throw Error('媒体格式无效');
    const blob = new Blob([Uint8Array.from(atob(match[2]), c => c.charCodeAt(0))], {
      type: match[1]
    });
    if (m.kind === 'photo' && m.id !== 'bgm') await validateImage(blob);else if (m.id !== 'bgm' || m.kind !== 'audio' || !audio.canPlayType(blob.type)) throw Error('未知媒体类型');
    media.push({
      ...m,
      blob
    });
  }
  if (confirm('用备份替换本机当前小屋内容？')) await replaceData(next, media);
}
async function replaceData(next, media) {
  const old = localStorage.getItem(storageKey);
  localStorage.setItem(storageKey, JSON.stringify(next));
  try {
    await files('readwrite', s => {
      s.clear();
      for (const item of media) s.put(item);
    });
  } catch (e) {
    if (old === null) localStorage.removeItem(storageKey);else localStorage.setItem(storageKey, old);
    throw e;
  }
  state = next;
  sleeping = false;
  setSong(media.find(v => v.id === 'bgm'));
  refresh();
  settings();
  toast('小屋数据已更新');
}
