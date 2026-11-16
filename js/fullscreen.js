const screenButton = document.querySelector('#fullscreen');
const gameRoot = document.documentElement;
let windowMode = false;

function syncGameScreen() {
  const expanded = Boolean(document.fullscreenElement) || windowMode;
  gameRoot.classList.toggle('game-screen', expanded);
  screenButton.setAttribute('aria-pressed', String(expanded));
  $('#screen-label').textContent = expanded ? (windowMode ? '退出大屏' : '退出全屏') : '全屏游玩';
  $('#esc-action').textContent = expanded ? '退出' : '菜单';
  if (!dialog.open) room.focus({preventScroll:true});
}
async function leaveGameScreen() {
  windowMode = false;
  if (document.fullscreenElement) await document.exitFullscreen();
  syncGameScreen();
}
screenButton.onclick = async () => {
  if (screenButton.disabled) return;
  screenButton.disabled = true;
  try {
    if (gameRoot.classList.contains('game-screen')) await leaveGameScreen();
    else if (document.fullscreenEnabled) await gameRoot.requestFullscreen();
    else windowMode = true;
  } catch {
    windowMode = !document.fullscreenElement;
  } finally {
    screenButton.disabled = false;
    syncGameScreen();
    if (windowMode) toast('当前浏览器已使用窗口内大屏模式');
  }
};
document.addEventListener('fullscreenchange', syncGameScreen);
