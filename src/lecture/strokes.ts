// Lecture Z — how each letter is written (script letters, as taught in French schools): its
// strokes in order, each one a line drawn in one go, without lifting the finger.
//
// Points are [u, v]: u goes across the letter's ink, 0 (left) to 1 (right); v goes up by
// writing lines: 0 = baseline, 1 = top of the small letters, 2 = top of the tall ones (l, b),
// -1 = bottom of the letters that go down (p, g). The drawing game fits them onto the real letter.

export type Pt2 = [number, number];
export type Stroke = Pt2[];

/** An arc of an ellipse, angles in degrees (0 = right, 90 = up), from a0 to a1 (more = anticlockwise). */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Pt2[] {
  const n = Math.max(6, Math.round(Math.abs(a1 - a0) / 12));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as Pt2;
  });
}

// The round of a, d, g, q: from the top right, anticlockwise over the top and back up.
const bowl = (cx: number) => arc(cx, 0.5, cx - 0.04, 0.48, 35, 340);
// A bridge (n, m, h, r): from the stem up over the top and down.
const bridge = (x0: number, x1: number): Pt2[] => [
  [x0, 0.6],
  [x0 + (x1 - x0) * 0.25, 0.92],
  [x0 + (x1 - x0) * 0.55, 1],
  [x1 - (x1 - x0) * 0.08, 0.85],
  [x1, 0.55],
  [x1, 0],
];
const dot = (u: number): Stroke => [[u, 1.45]];

export const STROKES: Record<string, Stroke[]> = {
  a: [bowl(0.45), [[0.93, 1], [0.93, 0]]],
  b: [[[0.1, 2], [0.1, 0]], arc(0.52, 0.5, 0.42, 0.48, 155, -160)],
  c: [arc(0.55, 0.5, 0.5, 0.5, 40, 318)],
  d: [bowl(0.45), [[0.92, 2], [0.92, 0]]],
  e: [[[0.06, 0.5], [0.94, 0.5], ...arc(0.5, 0.5, 0.45, 0.48, 0, 318)]],
  é: [[[0.06, 0.5], [0.94, 0.5], ...arc(0.5, 0.5, 0.45, 0.48, 0, 318)], [[0.72, 1.62], [0.42, 1.25]]],
  è: [[[0.06, 0.5], [0.94, 0.5], ...arc(0.5, 0.5, 0.45, 0.48, 0, 318)], [[0.3, 1.62], [0.6, 1.25]]],
  f: [[[0.95, 1.85], [0.72, 2], [0.45, 1.9], [0.36, 1.6], [0.36, 0]], [[0.05, 1], [0.85, 1]]],
  g: [bowl(0.45), [[0.92, 1], [0.92, -0.55], [0.75, -0.92], [0.45, -1], [0.12, -0.82]]],
  h: [[[0.1, 2], [0.1, 0], ...bridge(0.1, 0.9)]],
  i: [[[0.5, 1], [0.5, 0]], dot(0.5)],
  j: [[[0.75, 1], [0.75, -0.6], [0.6, -0.92], [0.3, -1], [0.05, -0.9]], dot(0.75)],
  k: [[[0.1, 2], [0.1, 0]], [[0.88, 1], [0.15, 0.4], [0.92, 0]]],
  l: [[[0.5, 2], [0.5, 0]]],
  m: [[[0.07, 1], [0.07, 0], ...bridge(0.07, 0.5), ...bridge(0.5, 0.93)]],
  n: [[[0.1, 1], [0.1, 0], ...bridge(0.1, 0.9)]],
  o: [arc(0.5, 0.5, 0.48, 0.48, 90, 450)],
  p: [[[0.1, 1], [0.1, -1]], arc(0.52, 0.5, 0.42, 0.48, 155, -160)],
  q: [bowl(0.45), [[0.9, 1], [0.9, -1]]],
  r: [[[0.12, 1], [0.12, 0], [0.12, 0.6], [0.35, 0.92], [0.65, 1], [0.95, 0.92]]],
  s: [[[0.88, 0.88], [0.6, 1], [0.25, 0.95], [0.1, 0.75], [0.3, 0.55], [0.75, 0.42], [0.92, 0.22], [0.7, 0.02], [0.3, 0], [0.06, 0.12]]],
  t: [[[0.35, 1.6], [0.35, 0.25], [0.5, 0.02], [0.92, 0.06]], [[0.05, 1], [0.85, 1]]],
  u: [[[0.1, 1], [0.1, 0.35], [0.3, 0.02], [0.6, 0.02], [0.88, 0.3], [0.9, 1], [0.9, 0]]],
  v: [[[0.03, 1], [0.5, 0], [0.97, 1]]],
  w: [[[0.02, 1], [0.25, 0], [0.5, 0.9], [0.75, 0], [0.98, 1]]],
  x: [[[0.05, 1], [0.95, 0]], [[0.95, 1], [0.05, 0]]],
  y: [[[0.05, 1], [0.5, 0.05]], [[0.95, 1], [0.35, -0.85], [0.1, -1]]],
  z: [[[0.05, 1], [0.95, 1], [0.05, 0], [0.95, 0]]],
};
