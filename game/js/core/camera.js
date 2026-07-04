// Kamera: zentriert auf einen Punkt, an Weltränder geklemmt.
// Konvention: camera.x/y bleiben Float. JEDER Zeichner rechnet
// screenX = Math.round(worldX - cam.x), screenY = Math.round(worldY - cam.y).

export function createCamera(viewW, viewH) {
  return {
    x: 0,
    y: 0,
    viewW,
    viewH,
    follow(cx, cy, worldW, worldH) {
      const maxX = Math.max(0, worldW - viewW);
      const maxY = Math.max(0, worldH - viewH);
      this.x = Math.min(Math.max(cx - viewW / 2, 0), maxX);
      this.y = Math.min(Math.max(cy - viewH / 2, 0), maxY);
    },
  };
}
