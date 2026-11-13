# Lecture Z — design draft (v2)

A French early-reading game for a 6-year-old (CP), themed on Dragon Ball. Goku powers up as the child learns.
It goes at the pace of the class, about **2 new sounds a week**, and the app adds daily practice on top.

## Core principles

1. **Follow the class.** Each week the parent enters what the class is doing ("cette semaine : l, r"). The game never uses a sound the class hasn't seen.
2. **Slow stages, gated by mastery.** Letters → syllables → two-syllable words → simple words → small groups ("le lama") → sentences (months later). The calendar alone never opens the next stage: the child has to show mastery first.
3. **Only decodable content.** Every syllable and word has its sounds tagged. Something appears only once all of its sounds are learned.
4. **The app always talks; the child never has to.** The child answers by tapping, dragging or catching. There's no reading aloud and no microphone. Reading is checked by having the child pick between written options. Picking the right one out of "la / lo / ra" after hearing "la" requires decoding all three.
5. **Review every day.** Every session starts with a warm-up on old items, and a boss at the end of the week reviews everything.
6. **Errors teach.** A wrong answer replays the sound, shows the right answer and brings the item back later. Nothing is ever "game over".
7. **Short and daily.** About 10 minutes a day is better than 30 minutes twice a week.

## Realistic progression (CP year, ~2 sounds a week)

| Weeks | Stage | What the child does | Example |
|---|---|---|---|
| 1–3 | **Voyelles** | Hear the sound, recognise the letter. No blending yet. | a i o u e é |
| 4–5 | **First syllables** | First consonant(s) + known vowels. Lots of blending, nothing else. | l → la li lo lu le lé |
| 5–8 | **Syllables, more of them** | Each new consonant multiplies the syllables. Tell apart la/lo and la/ra. | r, m, s, f, ch… |
| ~7–10 | **Two-syllable words** | Read 2 syllables joined into a real word, with a picture | ami, lama, rame, mari, sofa |
| ~10–14 | **Words + first mots outils** | Short words, reversed syllables (al, ar), le/la/un | le lama, un rat |
| Jan → | **Groups and short sentences** | 3–5 words → pick the picture | Le rat a mal. |

Each stage opens when the parent allows it **and** the mastery check passes. For example: words only after 2 vowels and 3 consonants are mastered, plus ≥ 85% on syllables over 3 different days.
The weeks above are a guide; the child's own results set the actual pace.

## The weekly cycle

The parent enters the week's sounds (usually 2). The app spreads them out like this:

| Day | Session focus |
|---|---|
| 1–2 | Sound 1: discovery, then recognition. It's used in syllables only once recognition is solid. |
| 3–4 | Sound 2, the same way. Sound 1 moves into the mixed practice. |
| 5 | **Weekly boss**: everything from the week, plus older items that are due |
| Weekend | Free practice: review whatever is due, plus mini-games |

Extra sessions in the same day just give more review. They never jump ahead to the next sound.

## A daily session (~10 min)

1. **Échauffement** (1–2 min): 3–4 review items from earlier weeks, chosen by the review engine.
2. **Entraînement** (4–5 min): 6–8 items on the current sound, at the level the child has reached.
3. **Défi** (2 min): 3–4 items from the current stage's top exercise, mixed. On day 5 the boss replaces this step.
4. **Jeu bonus** (90 s): opens with ≥ 1 star.

## Mastery engine (per item)

Every item (sound, syllable, word) has a level from 0 to 5:

| Level | How it's practised |
|---|---|
| 0–1 | Discovery: watch and listen, then pick from 2 options |
| 2–3 | Pick from 3–4 options, including look-alikes (b/d, m/n…) |
| 4 | Used inside harder tasks (the letter inside syllables, the syllable inside words) |
| 5 | Mastered: comes back only in review (after 3, 7, then 14 days) |

- **Moving up:** ≥ 80% correct on **2 different days**. This rules out "lucky today".
- **Moving down:** a miss in review.
- **Look-alike pairs:** b/d, p/q, m/n, f/v, ch/j, on/ou, an/on. Once both sounds are learned they show up as each other's wrong options, and the game counts mix-ups.

## Exercises (all answered by tapping)

**Sounds and letters**

- **J'entends ?** Hear "moto" with its picture. Is there an [o]? Yes or no.
- **Trouve la lettre.** Hear [i], tap it among 2–4 letters.
- **Attrape la lettre.** Letters fall down; Goku catches the one he hears. A game version of the same skill.
- **Trace la lettre.** Trace it with a finger, as an option. It helps memory.

**Syllables**

- **Fusion.** Drag `l` onto `a`: they merge with a fusion-dance effect and you hear "la". This is the core blending exercise.
- **Quelle syllabe ?** Hear "lo", tap it among la / lo / lu, later la / lo / ra.
- **Complète.** Hear "mi", then pick the missing letter in `m ?` or `? i`.

**Words** (only from the "two-syllable words" stage)

- **Construis.** Picture plus audio of "lama"; drag the syllables into the right order.
- **Lis et choisis.** "rame" is written, with no audio; pick the right one of 2, later 3, pictures. This is the real reading test.
- **Quel mot ?** A picture; pick the right one of 2–3 written words (lama / lame / rama).

## Bosses and rewards

- **Weekly boss** (day 5): 10–12 mixed items. Each right answer is a Kamehameha hit; a wrong one costs Goku a hit and the item comes back. The boss always falls in the end, and accuracy sets the stars.
- **About 30 bosses in the school year**, roughly one villain per week, from the Saibaman up to Jiren.
- **Transformations come every ~3 bosses (about once a month),** so it stays a big moment:
  Goku enfant → adulte → Kaioken → Kaioken ×10 → **Super Saiyan** → SSJ2 → SSJ3 → SSJ God → SSJ Blue → Ultra Instinct.
- **Ki (stars):** every session adds to Goku's power gauge, so there's visible progress every day.
- **Dragon Balls:** earned for a 3-star boss or a 5-day streak. 7 balls → a Shenron wish: unlock a mini-game or a character (Vegeta, Gohan, Piccolo).
- **Bonus mini-games:** capped at 90 s. The existing Éclair de Feu and Last Saiyan get a `?timer=90` option, and new ones are themed on syllables (Kamehameha des syllabes).

## Parent space (behind a gate: hold the button for 3 s)

- **The week:** pick this week's sounds from the list of French graphemes. Presets for common methods (Taoki, Pilotis…) are possible later.
- **Stage unlocks:** allow two-syllable words, mots outils, and so on. The mastery check still applies.
- **Mots outils:** added only when the class introduces them.
- **Reading aids:** alternate-colour syllables, greyed-out silent letters, script font (Andika) or cursive.
- **Progress view:** level of each sound and syllable, look-alike mix-ups, days played.
- **Recorder:** record the isolated sounds ("mmm", not "èm") in your own voice. They replace text-to-speech, which gets single sounds wrong.

## Audio

- **Words and syllables:** OpenAI text-to-speech (the key is already in the repo), in a slow teacher voice. Generated once and cached as mp3.
- **Isolated sounds:** parent recordings. Text-to-speech is only the fallback.

## Tech

- New route `/lecture` in the existing Next.js app, client-side, tablet-first and landscape.
- Content lives as JSON: graphemes, generated syllables, ~400 tagged words. Progress is kept in localStorage, with export/import.

## Build phases

1. **MVP (stages Voyelles + First syllables):**
   - the parent's weekly setup
   - the daily session flow
   - the mastery engine
   - letter and syllable exercises (including Fusion)
   - weekly boss
   - Goku's first 3 forms
   - text-to-speech audio
   - 1 timed mini-game
2. **More syllables, then the two-syllable word stage with pictures:**
   - the recorder
   - the look-alike drills
   - Dragon Balls
3. **Later stages:**
   - mots outils and groups of words
   - short sentences
   - more bosses and forms

## As built (current rules)

This replaces the older details above where they differ.

- **Letters known:** the parent space lists every letter already seen, in class order; the week's letters are marked ★. Exercises mix them so the answer isn't always the letter being learned.
- **Picking a letter:** the home screen shows one row of letters in that same order; the child taps one to train on it. By default it's the first of the week's letters not yet cleared.
- **Session (10 questions):** 2 warm-up, then 6 training (4 on the chosen letter, 2 on other known letters, with the chosen letter always among the choices), then 2 challenge. A miss comes back about 3 questions later.
- **Exercises:**
  - "Trouve le son « i » comme dans idée": drag the letter into the gap, from 4–5 choices that include vowels.
  - "Est-ce que tu entends… ?"
  - "Trouve tous les…"
  - first sound of a word
  - fusion and syllables, once consonants are recognised.
- **Clearing a letter:** a session where the letter is practised at least twice with ≥ 80% right counts as a success (one dot). 3 successes clear the letter: it gets a ✓ and practice moves on to the next one. Cleared letters still come back in review.
- **Rewards:** each cleared letter powers Goku up one step, with one reward screen:
  1. Petit Goku → magic staff → flying cloud → Kamehameha
  2. Goku grows up → Kaioken → Genkidama → Kaioken ×10
  3. Super Saiyan → Instant Transmission → SSJ2 → SSJ3 → God → Blue → Ultra Instinct
  4. then the 7 Dragon Balls, one per letter, and Shenron
- **Weekly boss:** reviews the week, gives ki. It no longer changes Goku's form.
- **Voice:**
  - Goku's lines come from a fixed catalog (`src/lecture/voice.ts`), generated once with ElevenLabs by `npx tsx scripts/gen-voice.mts` into `public/lecture/voice/`. The game never calls ElevenLabs.
  - The script only generates missing or changed clips and removes unused ones.
  - A parent's recording replaces a single sound; the device voice is the last fallback.
- **Mini-games:** Nuage magique, Kaméhaméha, Bulles de ki, 45 s each, one after each session.
- **Zénis and Bulma's shop** (see `src/lecture/shop.ts` for the full rationale):
  - **Earning:** zénis are earned only by reading. Each right answer pays by difficulty: "do you hear?" 2, find-all 3, first letter 3, complete the word 4, fusion 4, syllable 5. A retry pays 1, and boss answers pay double. A session adds +5 for finishing and +10 for 3 stars; clearing a letter adds +25. A session brings about 30–45.
  - **Spending:** companions next to Goku (60–450), home scenery (60–200), aura colours (70–250), harder mini-game levels (100/200: faster, more points), and senzu beans (25, +15 s on a mini-game, max 5).
  - **Not for sale:** Goku's power-ups, so learning stays the main progression.
- **Mini-games unlock with letters:** Nuage magique from the start, Kaméhaméha after 1 cleared letter, Boules magiques after 2. Locked ones show how many letters are left. In Boules magiques the Dragon Balls rise diagonally and bounce off the walls; the first two right balls glow.
- **Update: transformations are bought.**
  - Goku's ladder (kid → staff → cloud → Kamehameha → grown up → Kaioken → … → Ultra Instinct → 7 Dragon Balls → Shenron) is the first tab of Bulma's shop. Steps are bought one at a time, in story order, for 40 to 420 zénis.
  - Friends, places and the gold aura appear only once Goku reaches their era: Gohan and Piccolo after he grows up, Vegeta after the Kaioken, Trunks after Super Saiyan.
  - Clearing a letter gives +25 zénis and a "Lettre réussie" screen.
  - The home gauge shows zénis saved toward the next transformation.
  - Mini-games open with cleared letters or can be bought earlier: Kaméhaméha 120, Boules magiques 180.
- **Update: bosses follow letters, not weeks.**
  - **Letter boss:** each cleared letter unlocks one. It's the easier fight: 6 questions, mostly on that letter, 4 choices, +15 zénis.
  - **Revision boss:** every 3 cleared letters. It's harder: 12 questions over those letters and everything before, 5 choices and syllables, +40 zénis.
  - **Waiting bosses** queue up on the home screen.
  - **Opponents follow Goku's step on the ladder** (`BOSS_ERAS` in `content.ts`):

    | Goku's era | Letter boss | Revision boss |
    |---|---|---|
    | Kid | Krilin au tournoi | Piccolo Daimaô |
    | Grown up | Piccolo au tournoi | Saibaman |
    | Kaioken | Saibaman | Vegeta |
    | Namek | Soldat de Freezer | Freezer |
    | Super Saiyan | Freezer | Freezer doré |
    | SSJ2 | Cell | Cell parfait |
    | Gods | Vegeta Blue | Freezer doré |
- **Update: transformations are earned, not bought.**
  - Goku moves one step up the ladder for each cleared letter, and the "Lettre réussie" screen announces the new power (+25 zénis). The shop's Goku tab only shows his progress.
  - Zénis buy friends (Master Roshi, Krilin, Gohan…), places, auras, games and senzu, gated by Goku's era.
  - The home gauge shows the current letter's progress toward the next power.
