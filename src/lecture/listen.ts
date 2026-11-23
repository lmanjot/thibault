// Lecture Z — listening to a syllable read aloud (client side).
// Records the microphone until a short silence after the voice, makes a 16 kHz mono WAV and sends it with the
// expected syllable to /api/lecture-pronounce, where Azure Speech scores how well it was read (0-100).
// The microphone is released after each recording, so it is never left on between questions.

/** From this score a reading counts as right (a different syllable scores near 0). */
export const GOOD_SCORE = 60;

export type Heard =
  | { kind: "scored"; score: number; heard: string }
  | { kind: "silence" } // nothing loud enough was said
  | { kind: "unavailable" }; // no microphone, refused, offline or server error: the tap version takes over

let ctx: AudioContext | null = null;

/** Record one reading: resolves when he stops talking (or after a few seconds). */
async function record(): Promise<{ samples: Float32Array; rate: number; spoke: boolean }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") await ctx.resume();
  const src = ctx.createMediaStreamSource(stream);
  const proc = ctx.createScriptProcessor(2048, 1, 1);
  const chunks: Float32Array[] = [];
  const rate = ctx.sampleRate;
  const frame = 2048 / rate;
  return new Promise((resolve) => {
    let t = 0, floor = 0, floorN = 0, voiced = 0, lastVoice = 0, done = false;
    proc.onaudioprocess = (e) => {
      if (done) return;
      const d = e.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(d));
      let sum = 0;
      for (let i = 0; i < d.length; i++) sum += d[i] * d[i];
      const rms = Math.sqrt(sum / d.length);
      t += frame;
      if (t < 0.25) {
        floor += rms; // the room's own noise, first quarter second
        floorN++;
        return;
      }
      const thr = Math.max(0.015, (floor / Math.max(1, floorN)) * 3);
      if (rms > thr) {
        voiced += frame;
        lastVoice = t;
      }
      const spoke = voiced > 0.12;
      if ((spoke && t - lastVoice > 0.7) || t > 4.5 || (!spoke && t > 4)) {
        done = true;
        proc.disconnect();
        src.disconnect();
        stream.getTracks().forEach((tr) => tr.stop());
        const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
        let o = 0;
        for (const c of chunks) {
          out.set(c, o);
          o += c.length;
        }
        resolve({ samples: out, rate, spoke });
      }
    };
    src.connect(proc);
    proc.connect(ctx!.destination);
  });
}

function toWav16k(samples: Float32Array, rate: number): Blob {
  const ratio = rate / 16000;
  const n = Math.floor(samples.length / ratio);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  w(8, "WAVE");
  w(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 16000, true);
  v.setUint32(28, 32000, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * ratio);
    const b = Math.min(samples.length, Math.floor((i + 1) * ratio));
    let s = 0;
    for (let j = a; j < b; j++) s += samples[j];
    s = Math.max(-1, Math.min(1, s / Math.max(1, b - a)));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}

/** Listen to him reading `text` (« la ») and score it. onRecorded: the recording is over, the score is on its way. */
export async function listen(text: string, onRecorded?: () => void): Promise<Heard> {
  if (!navigator.mediaDevices?.getUserMedia) return { kind: "unavailable" };
  let rec;
  try {
    rec = await record();
  } catch {
    return { kind: "unavailable" }; // refused or no microphone
  }
  if (!rec.spoke) return { kind: "silence" };
  onRecorded?.();
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 10000);
    const r = await fetch(`/api/lecture-pronounce?text=${encodeURIComponent(text)}`, {
      method: "POST",
      headers: { "Content-Type": "audio/wav" },
      body: toWav16k(rec.samples, rec.rate),
      signal: ctl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return { kind: "unavailable" };
    const data = (await r.json()) as { status?: string; score?: number; heard?: string };
    return { kind: "scored", score: data.status === "Success" ? (data.score ?? 0) : 0, heard: data.heard ?? "" };
  } catch {
    return { kind: "unavailable" };
  }
}
