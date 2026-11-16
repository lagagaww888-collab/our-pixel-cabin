let photoUrl = '',
  audioUrl = '',
  song = null;
const audio = $('#audio');
audio.volume = .45;
audio.muted = false;
let awaitingGesture = false;
let playbackError = '';
const bundledSong = {title: THEME_TRACK.filename};
async function startMusic() {
  const source = audio.src;
  awaitingGesture = false;
  playbackError = '';
  try {
    await audio.play();
  } catch (error) {
    if (source !== audio.src || error.name === 'AbortError') return;
    awaitingGesture = error.name === 'NotAllowedError';
    if (!awaitingGesture) playbackError = '音频无法播放，请在八音盒中更换文件';
  }
  musicStatus();
}
function unlockMusic(event) {
  if (awaitingGesture && event.isTrusted && !event.repeat) startMusic();
}
document.addEventListener('keydown', unlockMusic);
document.addEventListener('click', unlockMusic);
function freePhoto() {
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = '';
}
dialog.addEventListener('close', freePhoto);
async function photos(index = 0) {
  const stamp = version;
  panel('照片墙', '正在翻开相册…');
  const items = (await allMedia()).filter(v => v.kind === 'photo').sort((a, b) => a.id.localeCompare(b.id));
  if (stamp !== version) return;
  freePhoto();
  index = (index + items.length) % items.length || 0;
  let v = items[index];
  if (v) photoUrl = URL.createObjectURL(v.blob);
  panel('照片墙', (v ? '<img class="photoimg" id="pic" alt="上传的照片"><div class="row">' + btn('prev', '上一张') + '<small>' + (index + 1) + ' / ' + items.length + '</small>' + btn('next', '下一张') + '</div>' + field('pt', '照片标题', v.title) + field('pd', '拍摄日期', v.date, 'date') + field('ps', '这张照片的故事', v.body, 'area') + '<div class="row">' + btn('psave', '保存照片信息', true) + btn('pdel', '删除照片') + '</div>' : '<p class="sheet">照片墙还空着。挑一张喜欢的合照，留下第一段故事吧。</p>') + '<label>添加一张照片<input type="file" id="upload" accept="image/png,image/jpeg,image/webp,image/gif,image/avif"></label>');
  if (v) {
    $('#pic').src = photoUrl;
    $('#pic').onclick = e => e.target.classList.toggle('big');
    wire('prev', () => photos(index - 1));
    wire('next', () => photos(index + 1));
    wire('psave', async () => {
      await putMedia({
        ...v,
        title: val('pt'),
        date: val('pd'),
        body: val('ps')
      });
      toast('照片信息已保存');
    });
    wire('pdel', async () => {
      if (confirm('删除这张照片和故事？')) {
        await removeMedia(v.id);
        await photos(index);
      }
    });
  }
  $('#upload').onchange = async e => {
    try {
      const f = e.target.files[0];
      if (!f) return;
      await validateImage(f);
      const id = 'photo-' + Date.now() + '-' + uid();
      await putMedia({
        id,
        kind: 'photo',
        blob: f,
        title: '',
        date: today(),
        body: ''
      });
      if (active === 'photo') await photos(items.length);
    } catch (err) {
      toast('照片导入失败：' + err.message);
    }
  };
}
async function validateImage(file) {
  if (!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)) throw Error('请选择常见图片格式');
  const url = URL.createObjectURL(file);
  try {
    const im = new Image();
    im.src = url;
    await im.decode();
  } finally {
    URL.revokeObjectURL(url);
  }
}
function setSong(v) {
  audio.pause();
  audio.removeAttribute('src');
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = '';
  awaitingGesture = false;
  playbackError = '';
  song = v || bundledSong;
  if (v?.blob) {
    audioUrl = URL.createObjectURL(v.blob);
    audio.src = audioUrl;
  } else audio.src = THEME_TRACK.file;
  audio.load();
  musicStatus();
}
function musicStatus() {
  const playing = !audio.paused;
  $('#musicstate').textContent = playbackError || (playing ? '♫ 正在播放' : awaitingGesture ? '按移动键或点击小屋开启音乐' : '已暂停');
  $('#musicbar strong').textContent = song?.blob ? song.title : THEME_TRACK.name + ' · ' + THEME_TRACK.artist;
  if (active !== 'music' || !$('#play')) return;
  $('#play').textContent = playing ? '暂停' : '播放';
  $('#mute').textContent = audio.muted ? '开启声音' : '静音';
  $('.musicbox').classList.toggle('playing', playing);
  $('#seek').value = audio.duration ? 100 * audio.currentTime / audio.duration : 0;
  const fmt = t => Number.isFinite(t) ? Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') : '0:00';
  $('#time').textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
}
for (const ev of ['play', 'pause', 'timeupdate', 'loadedmetadata', 'volumechange', 'ended']) audio.addEventListener(ev, musicStatus);
const songReady = files('readonly', s => s.get('bgm')).catch(() => null).then(v => {
  setSong(v);
  startMusic();
});
async function music() {
  const stamp = version;
  await songReady;
  if (stamp !== version) return;
  panel('小屋八音盒', '<img class="musicbox" alt="木质八音盒" src="' + ASSETS.music + '"><div style="text-align:center"><h2>' + esc(song.blob ? song.title : THEME_TRACK.name) + '</h2><p>' + (song.blob ? '本地导入' : THEME_TRACK.artist) + '</p></div><p class="sheet">' + (song ? '本地音频 · ' + esc(song.title) : '请导入你的专属 BGM') + '</p><div class="row">' + btn('play', '播放', true) + btn('mute', '开启声音') + '<small id="time"></small></div><label>播放进度<input id="seek" type="range" min="0" max="100" step=".1"></label><label>音量<input id="volume" type="range" min="0" max="1" step=".01" value="' + audio.volume + '"></label><label>导入本地音频<input id="sound" type="file" accept="audio/*"></label>' + (song.blob ? btn('erase', '移除导入音频并恢复主题曲') : ''));
  musicStatus();
  wire('play', async () => {
    if (!song) return toast('请导入你的专属 BGM');
    if (audio.paused) {
      audio.muted = false;
      await startMusic();
    } else audio.pause();
  });
  wire('mute', () => audio.muted = !audio.muted);
  $('#seek').oninput = e => {
    if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * e.target.value / 100;
  };
  $('#volume').oninput = e => {
    audio.volume = +e.target.value;
  };
  $('#sound').onchange = async e => {
    try {
      const f = e.target.files[0];
      if (!f) return;
      if (!audio.canPlayType(f.type)) throw Error('浏览器不支持这个音频格式');
      const rec = {
        id: 'bgm',
        kind: 'audio',
        title: f.name,
        blob: f
      };
      await putMedia(rec);
      setSong(rec);
      await startMusic();
      if (active === 'music') await music();
    } catch (err) {
      toast('音频导入失败：' + err.message);
    }
  };
  if (song.blob) wire('erase', async () => {
    await removeMedia('bgm');
    setSong(null);
    await startMusic();
    await music();
  });
}
