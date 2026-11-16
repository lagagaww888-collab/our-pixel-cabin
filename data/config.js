const ASSETS = Object.fromEntries('front left right back walk run sit sleep happy shy surprised thinking upset boy music album-cover tier0 tier1 tier2 tea rug post reading-chair rilakkuma plant-bench bedside npc-gintoki npc-shinpachi npc-kagura npc-sadaharu npc-elizabeth room-night room-day home diary photo mail gift plant desk shelf bed settings gintoki_cameo shinpachi_cameo kagura_cameo sadaharu_cameo elizabeth_cameo'.split(' ').map(n => [n, 'assets/' + n + '.png']));
const DEFAULTS = {
  name: '我们的像素小屋',
  girl: '',
  boy: '',
  welcome: '爷爷鱼欢迎回家',
  date: '',
  theme: 'night',
  companion: false,
  gifts: [{
    id: 'g1',
    title: '待填写的第一份礼物',
    body: '在设置里写下专属留言。',
    opened: false
  }, {
    id: 'g2',
    title: '待填写的惊喜',
    body: '这里留给你的下一份礼物。',
    opened: false
  }],
  diary: [],
  mail: [],
  goals: [],
  notes: [],
  water: 0
};
const THEME_TRACK = {
  name: 'Jump Up, Super Star!（八音盒版）',
  artist: '久保直人、辻勇旗',
  file: 'assets/jump-up-super-star-music-box.mp3',
  filename: '久保直人,辻勇旗 - Jump Up，Super Star！オルゴールバージョン.mp3'
};
const ITEMS = [['diary', '日记本', 278, 141, 58, 43], ['photo', '照片墙', 402, 29, 99, 41], ['gift', '礼物盒', 484, 153, 43, 44], ['mail', '信箱', 108, 25, 59, 49], ['shelf', '手办柜', 13, 15, 95, 122], ['bed', '床铺', 398, 80, 84, 88], ['plant', '盆栽', 267, 89, 72, 59], ['desk', '电脑桌', 122, 77, 74, 68], ['music', '八音盒', 354, 145, 32, 37]];



const BEAR = {name:'轻松熊', message:'此乃咆哮小熊，他很想你', spot:[30, 169, 34, 37]};
