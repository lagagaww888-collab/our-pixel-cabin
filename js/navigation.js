// Coordinates use the room's 560 × 252 art grid. Only furniture footprints block feet.
const footprints = [[14, 198, 93, 232], [268, 139, 338, 147], [487, 140, 531, 148], [123, 134, 190, 145], [278, 168, 334, 184], [350, 168, 387, 182], [398, 140, 489, 166], [486, 177, 523, 194]];
function canStand(x, y) {
  return x >= 12 && x <= 548 && y >= 140 && y <= 248 && !footprints.some(([l, t, r, b]) => x >= l && x <= r && y >= t && y <= b);
}
function findRoute(start, end) {
  const grid = 4,
    gridPoint = n => Math.round(n / grid) * grid;
  const first = {
    x: gridPoint(start.x),
    y: gridPoint(start.y),
    prev: null
  };
  const queue = [first],
    seen = new Set([first.x + ',' + first.y]);
  let best = first,
    min = Infinity;
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i],
      dist = Math.hypot(p.x - end.x, p.y - end.y);
    if (dist < min) {
      min = dist;
      best = p;
    }
    if (dist < 2) break;
    for (const [dx, dy] of [[4, 0], [-4, 0], [0, 4], [0, -4], [4, 4], [4, -4], [-4, 4], [-4, -4]]) {
      const x = p.x + dx,
        y = p.y + dy,
        key = x + ',' + y;
      if (seen.has(key) || !canStand(x, y) || !canStand(x, p.y) || !canStand(p.x, y)) continue;
      seen.add(key);
      queue.push({
        x,
        y,
        prev: p
      });
    }
  }
  const path = [];
  for (let p = best; p.prev; p = p.prev) path.push({
    x: p.x,
    y: p.y
  });
  return path.reverse();
}
