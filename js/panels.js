let active = '',
  version = 0;
function panel(title, html) {
  $('#mt').textContent = title;
  body.innerHTML = html + '<span id="feedback" role="status"></span>';
  if (!dialog.open) dialog.showModal();
}
function closePanel() {
  if (dialog.open) dialog.close();
}
$('#close').onclick = closePanel;
dialog.onclose = () => {
  active = '';
  version++;
  room.focus();
};
dialog.onclick = e => {
  if (e.target === dialog && !(e.clientX >= dialog.getBoundingClientRect().left && e.clientX <= dialog.getBoundingClientRect().right && e.clientY >= dialog.getBoundingClientRect().top && e.clientY <= dialog.getBoundingClientRect().bottom)) closePanel();
};
function btn(id, label, primary = false) {
  return '<button id="' + id + '" class="' + (primary ? 'primary' : '') + '">' + label + '</button>';
}
function field(id, label, value = '', type = 'text') {
  return '<label>' + label + (type === 'area' ? '<textarea id="' + id + '">' + esc(value) + '</textarea>' : '<input id="' + id + '" type="' + type + '" value="' + esc(value) + '">') + '</label>';
}
const val = id => document.getElementById(id).value.trim();
const records = {
  diary: ['日记本', '写日记', '这里还没有日记。写下今天想告诉对方的一句话吧。'],
  mail: ['信箱', '写信', '信箱里还很安静。写封信，留给下次回家的那个人。'],
  goals: ['两个人的小目标', '添加目标', '一起想做的第一件事是什么？'],
  notes: ['留言板', '写留言', '把想说的话留在这里吧。']
};
function recordList(k) {
  const [title, add, empty] = records[k];
  panel(title, btn('new', add, true) + (state[k].length ? '<div class="list">' + state[k].map((r, i) => btn('r' + i, esc(r.title) + '　<small>' + esc(r.date || '') + '</small>')).join('') + '</div>' : '<p class="muted">' + empty + '</p>'));
  wire('new', () => editRecord(k));
  state[k].forEach((r, i) => wire('r' + i, () => readRecord(k, r)));
}
function readRecord(k, r) {
  panel(records[k][0], '<article class="sheet reveal"><small>' + esc(r.date) + '</small><h2>' + esc(r.title) + '</h2><p class="story">' + esc(r.body) + '</p></article><div class="row">' + btn('edit', '编辑') + btn('del', '删除') + btn('back', '返回列表') + '</div>');
  wire('edit', () => editRecord(k, r));
  wire('back', () => recordList(k));
  wire('del', () => {
    if (confirm('删除这条记录？')) {
      state[k] = state[k].filter(v => v.id !== r.id);
      save();
      recordList(k);
    }
  });
}
function editRecord(k, r) {
  panel(records[k][1], field('title', '标题', r?.title) + field('date', '日期', r?.date || today(), 'date') + field('story', k === 'mail' ? '信件正文' : '写给对方的话', r?.body, 'area') + btn('save', '保存', true));
  wire('save', () => {
    const title = val('title'),
      body = val('story');
    if (!title || !body) return toast('请填写标题和正文。');
    const rec = {
      id: r?.id || uid(),
      title,
      date: val('date'),
      body
    };
    if (r) Object.assign(state[k].find(v => v.id === r.id), rec);else state[k].unshift(rec);
    if (save()) readRecord(k, rec);
  });
}
function gifts() {
  panel('礼物盒', state.gifts.length ? state.gifts.map((g, i) => '<div class="sheet row">' + art('gift') + '<div><strong>' + esc(g.title) + '</strong><br>' + btn('g' + i, g.opened ? '再看一次' : '拆开礼物') + '</div></div>').join('') : '在小屋设置中添加第一份礼物。');
  state.gifts.forEach((g, i) => wire('g' + i, () => {
    g.opened = true;
    save();
    panel('礼物盒', '<div class="row reveal">' + art('gift') + '<h2>' + esc(g.title) + '</h2></div><p class="sheet story reveal">' + esc(g.body) + '</p>' + btn('back', '返回礼物盒'));
    wire('back', gifts);
  }));
}
const collection = [['gintoki', '银时', '银发收藏卡旁，藏着一瓶草莓牛奶。'], ['shinpachi', '新八', '扶正这副眼镜，万事屋今天也开张了。'], ['kagura', '神乐', '柜子角落里还留着一把小伞。'], ['sadaharu', '定春', '摸摸毛茸茸的脑袋，定春往你身边蹭了蹭。'], ['elizabeth', '伊丽莎白', '举牌：今天也要好好吃饭。']];
function shelf(i = 0) {
  panel('银魂收藏架', '<div class="cameos">' + collection.map(([n, l], j) => btn('c' + j, art(n + '_cameo') + l, j === i)).join('') + '</div><p class="sheet reveal">' + collection[i][2] + '</p>');
  collection.forEach((_, j) => wire('c' + j, () => shelf(j)));
}
function plant() {
  panel('窗边盆栽', '<div class="row">' + art('plant') + '<div><h2>' + ['小小的幼苗', '长出新叶', '冒出花苞', '花开了'][Math.min(state.water, 3)] + '</h2>已浇水 ' + state.water + ' 次</div></div>' + btn('water', '浇一点水', true));
  wire('water', () => {
    state.water++;
    if (save()) {
      refresh();
      plant();
      toast('泥土喝饱了水。');
    }
  });
}
function bed() {
  panel('床铺', '<div class="row">' + art(sleeping ? 'sleep' : 'happy') + '<p>' + esc(state.girl || '你') + '，今晚也做个好梦。</p></div>' + btn('rest', sleeping ? '起床' : '熄灯入睡', true));
  wire('rest', () => {
    sleeping = !sleeping;
    if (sleeping) {
      state.theme = 'night';
      save();
    }
    refresh();
    closePanel();
  });
}
function desk() {
  panel('电脑桌', '<p class="sheet">纪念日　' + esc(state.date || '尚未填写') + '</p>' + btn('goals', '两个人的小目标') + btn('notes', '留言板') + btn('egg', '抽屉里的小纸条'));
  for (const k of ['goals', 'notes']) wire(k, () => recordList(k));
  wire('egg', () => {
    panel('抽屉里的小纸条', '<div class="row reveal">' + art('elizabeth_cameo') + '<p>伊丽莎白举起牌子：草莓牛奶在收藏架上。</p></div>' + btn('visit', '去看看'));
    wire('visit', () => shelf());
  });
}
function menu() {
  panel('小屋互动菜单', '<div class="list">' + ITEMS.map(([id, l]) => btn('m' + id, l)).join('') + '</div>');
  for (const [id] of ITEMS) wire('m' + id, () => openPanel(id));
}
async function openPanel(id) {
  stopKeys();
  route = [];
  target = null;
  active = id;
  version++;
  try {
    if (id === 'bear') {
      return panel(BEAR.name, '<div class="greeting reveal">' + art('rilakkuma') + '<p class="story">' + esc(BEAR.message) + '</p></div>');
    }
    if (id.startsWith('npc-')) return greet(id.slice(4));
    if (records[id]) return recordList(id);
    await {
      menu,
      gift: gifts,
      shelf: cabinet,
      bed,
      plant,
      desk,
      photo: photos,
      music,
      settings
    }[id]();
  } catch (e) {
    panel('暂时无法打开', '请检查本地浏览器存储权限。<p>' + esc(e.message) + '</p>');
  }
}
$('#settings').onclick = () => openPanel('settings');
$('#musicbar').onclick = () => openPanel('music');

const cabinetTiers = [
  ['上层','NewJeans × 飞天小女警','五位飞天小女警造型的成员并肩站在柜灯下，旁边的白兔也有自己的小底座。'],
  ['中层','NewJeans 兔子手办','五只粉彩兔子各有一个位置。戴耳机的薄荷色兔子，正在偷偷听歌。'],
  ['下层','NewJeans 应援角','兔耳灯亮起，五位成员的像素封面后露出一角淡紫唱片，旁边摆着银色小麦克风。']
];
function cabinet(index=0) {
  const [level,title,story]=cabinetTiers[index];
  panel('三层手办展示柜','<div class="row">'+cabinetTiers.map(([label],i)=>btn('fan'+i,label,index===i)).join('')+'</div><div class="case-view '+(index===2?'lit':'')+'">'+art('tier'+index)+'</div><h2>'+title+'</h2><p class="sheet reveal">'+story+'</p>'+(index===2?btn('cover','查看专辑封面'):'')+btn('cards','翻看银魂收藏卡'));
  cabinetTiers.forEach((_,i)=>wire('fan'+i,()=>cabinet(i)));
  if(index===2) wire('cover',()=>{panel('专辑封面','<img class="album-cover" alt="NewJeans 像素专辑封面" src="'+ASSETS['album-cover']+'">'+btn('returnCase','回到应援角'));wire('returnCase',()=>cabinet(2))});
  wire('cards',()=>shelf());
}

