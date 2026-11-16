const visitors = VISITORS.map((profile, index) => {
  const button = document.createElement('button');
  button.className = 'resident';
  button.setAttribute('aria-label', '与' + profile.name + '互动');
  button.title = profile.name + ' · 打招呼';
  button.innerHTML = art('npc-' + profile.id);
  button.onclick = () => openPanel('npc-' + profile.id);
  button.style.height = profile.height / 2.52 + '%';
  button.style.width = profile.height * .8 / 5.6 + '%';
  $('#hits').append(button);
  const [x, y] = profile.route[0];
  return {profile, button, x, y, waypoint:1, pause:1 + index * .85, facing:1};
});
function updateVisitors(dt, now) {
  for (const v of visitors) {
    const [tx, ty] = v.profile.route[v.waypoint];
    const dx = tx-v.x, dy = ty-v.y, distance = Math.hypot(dx,dy);
    const paused = dialog.open || sleeping || v.button.matches(':hover, :focus-visible') || Math.hypot(v.x-position.x,v.y-position.y)<22;
    let walking = false;
    if (!paused && v.pause > 0) v.pause -= dt;
    else if (!paused && distance > .2) {
      const step = Math.min(distance,dt*10);
      v.x += dx/distance * step;
      v.y += dy/distance * step;
      if (Math.abs(dx) > 1) v.facing = dx < 0 ? -1 : 1;
      walking = true;
    } else if (!paused) {
      v.waypoint = (v.waypoint+1)%v.profile.route.length;
      v.pause = 3.2;
    }
    v.button.style.left = v.x/5.6 + '%';
    v.button.style.top = v.y/2.52 + '%';
    v.button.style.zIndex = Math.round(v.y);
    v.button.firstElementChild.style.transform = 'translateY(' + (walking ? -Math.abs(Math.sin(now/115))*2 : 0) + 'px) scaleX('+v.facing+')';
  }
}
function greet(id, answered=false) {
  const v = VISITORS.find(v=>v.id===id);
  panel(v.name,'<div class="greeting">'+art('npc-'+id)+'<p class="story">'+esc(answered?v.reply:v.greeting)+'</p></div>'+ (answered?btn('bye','回到小屋'):btn('reply',v.action,true)));
  if(answered) wire('bye',closePanel); else wire('reply',()=>greet(id,true));
}

