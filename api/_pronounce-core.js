// Lecture Z — how well a syllable was read aloud (server side), with Azure Speech pronunciation assessment.
// The device records a short WAV (16 kHz mono 16-bit) and sends it with the syllable it should be (?text=ra);
// Azure scores each sound against that syllable. Free tier (F0): 5 hours of audio a month, then it stops (no charge).
// Plain CommonJS, used by api/lecture-pronounce.js (live site) and src/app/api/lecture-pronounce/route.ts (local).
// Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (e.g. westeurope) in the project's environment variables.

const MAX_BYTES = 400000; // about 12 s of 16 kHz 16-bit audio
const TEXT = /^[a-zàâäéèêëîïôöùûüç' -]{1,24}$/i;

const pa = (x) => (x && x.PronunciationAssessment) || x || {};

/** → { status, body } */
async function handle(text, audio) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return { status: 503, body: { error: "no-key" } };
  if (!text || !TEXT.test(text)) return { status: 400, body: { error: "text" } };
  if (!audio || !audio.length || audio.length > MAX_BYTES) return { status: 413, body: { error: "size" } };

  const assessment = {
    ReferenceText: text,
    GradingSystem: "HundredMark",
    Granularity: "Phoneme",
    Dimension: "Comprehensive",
    EnableMiscue: true,
    PhonemeAlphabet: "IPA",
  };
  const url = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=fr-FR&format=detailed`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
      Accept: "application/json",
      "Pronunciation-Assessment": Buffer.from(JSON.stringify(assessment), "utf8").toString("base64"),
    },
    body: audio,
  });
  if (!r.ok) return { status: 502, body: { error: "azure", code: r.status, detail: (await r.text()).slice(0, 300) } };
  const data = await r.json();
  const best = (data.NBest || [])[0];
  if (data.RecognitionStatus !== "Success" || !best) return { status: 200, body: { status: data.RecognitionStatus || "NoMatch", heard: "", score: 0 } };
  const s = pa(best);
  return {
    status: 200,
    body: {
      status: "Success",
      heard: data.DisplayText || best.Display || best.Lexical || "",
      score: Math.round(s.AccuracyScore ?? 0),
      pron: Math.round(s.PronScore ?? 0),
      completeness: Math.round(s.CompletenessScore ?? 0),
      words: (best.Words || []).map((w) => ({
        word: w.Word,
        score: Math.round(pa(w).AccuracyScore ?? 0),
        error: pa(w).ErrorType || "None",
        phonemes: (w.Phonemes || []).map((p) => ({ p: p.Phoneme, score: Math.round(pa(p).AccuracyScore ?? 0) })),
      })),
    },
  };
}

module.exports = { handle };
