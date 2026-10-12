# SoundSteps — Phonics Playground

**Hear it. Say it. Blend it. Read it!**

**Live site:** https://jainprank.github.io/SoundSteps/

SoundSteps is a free, interactive phonics website for children aged about 3–8. It teaches reading with systematic synthetic phonics: letter sounds → blending → segmenting → letter teams → tricky words → sentences → stories.

- **No login, no sign-up, no ads, no payments.** It opens straight to the learning path.
- **Private by design.** No names, photos, voices or locations are collected. Progress is stored only in the browser (`localStorage`). Grown-ups can switch saving off or reset it.
- **Audio-first.** Every sound, word, sentence and instruction has a recorded clip in **Indian (default), British and American English**. Captions show everything that is said.
- **Works everywhere.** Phones, tablets and desktops, touch and keyboard. It's an installable PWA that works offline after the first visit.
- **Kind feedback.** No timers, no buzzers, no punitive scores. A miss replays the sound, gives a hint, removes a choice, and then shows the answer to tap.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Requires Node 20+. Audio clips are already committed under `public/audio/`, so you only need macOS to *regenerate* audio (see below).

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build the static site into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Curriculum and audio tests (Vitest) |
| `npm run test:e2e` | Plays **every** lesson, game and story in a real browser (Playwright) |
| `npm run audio` | Generate any missing or changed audio clips (macOS only) |

First time running end-to-end tests: `npx playwright install chromium`.

## What's inside

| Level | Title | What children do |
| --- | --- | --- |
| 0 | Meet the Sounds | Environmental and animal sounds, same/different, first sounds (no letters) |
| 1 | Alphabet Sounds | s a t p i n → m d g o c k → ck e u r h b → f ff l ll ss → j v w x → y z zz qu. Each letter: big letter, name vs sound, mouth tip, example pictures, say it, first-sound game, thumbs up/down, hear-and-choose, bubble review, group check |
| 2 | Blend Sounds | Watch-and-listen blending (letters light up, slide together), then independent blending with picture check; 2-, 3- and 4-sound words; optional "alien words" |
| 3 | Build Words | Count sounds, missing first/middle/last sound, drag-and-drop spelling, word chains (cat→cap→map→mop→top), word families |
| 4 | Letter Teams | sh ch th ng, ai ee igh oa, oo ar or ur er, ow oi: spot the team inside words, blend, Feed the Monster, Sound Safari |
| 5 | Bigger Words | Blends vs digraphs, syllables, magic e (cap→cape), -s/-ed/-ing, alternative sounds (cow/snow, moon/book), first sentences |
| 6 | Tricky Words | 31 high-frequency words; the decodable parts are sounded out and only the tricky bit is highlighted and explained |
| 7 | Beginner Reader | Read-and-match sentences, Reading Train, missing words, 4 decodable stories with questions |
| 8 | Confident Reader | Longer stories and information texts, new vocabulary, sequencing, who/what/where/why/how questions, predictions, pattern hunts, retelling |

Also available: **Play a Game** (9 games built from sounds the child has learned), **Read a Story**, a gentle **Daily Challenge** (no streaks), and a **For grown-ups** page with a learning guide, accent notes, settings and a sound-check page.

Every level ends with a friendly check. Passing it (70% right first time) opens the next level. Grown-ups can open all levels for children who already read.

## Project structure

```
src/
  content/            ← all curriculum data (edit here to add content)
    phonemes.ts         speech sounds + how to cut each one from a carrier word
    correspondences.ts  spellings → sounds, in teaching order (GROUPS)
    words.ts            word bank, written as spelling units: "sh i p", "c a=a_e k e=_"
    tricky.ts           tricky words with their tricky parts explained
    reading.ts          sentences, stories, questions, vocabulary, sequences
    level0.ts           listening-level content
    phrases.ts          everything Pip says
    curriculum.ts       levels and lessons built from reusable activity steps
    audioKeys.ts        every audio clip the app can play
    validate.ts         decodability checks used by tests
  activities/         ← reusable activity components (one engine for all levels)
  components/         ← UI pieces (Pip the fox, captions, tiles, mouth pictures…)
  lib/                ← audio engine, progress storage, sound effects, games
  pages/              ← routes
scripts/audio/        ← audio generator (macOS `say` + DSP for isolated phonemes)
tests/                ← curriculum/audio unit tests
e2e/                  ← end-to-end walkthrough of all content
```

## Adding content

The tests make sure every activity only uses sounds that have been taught by that point, every picture game has pictures, and every clip exists. After any change, run `npm test`. If it fails, the message tells you which word is too hard or which clip is missing.

**A word:** add a line to `src/content/words.ts`:

```ts
w("sh ee p", "🐑"),            // sh + ee + p, with a picture
w("c a=a_e k e=_", "🎂"),      // magic e: a uses a-e, the final e is silent
```

**A sound:** add a phoneme in `phonemes.ts` (with a `carve` recipe), a correspondence in `correspondences.ts`, and put it in a group in `GROUPS`.

**A sentence or story:** add it to `reading.ts`. Every word must be in the word bank or be a tricky word. The test lists any word that isn't.

**A lesson:** add a `lesson(...)` with a list of steps in `curriculum.ts`. Any activity type from the `Step` union can be used at any level.

**A game:** add an entry to `GAMES` in `src/lib/games.ts` that builds a step from the child's taught sounds.

Then generate audio for the new text: `npm run audio`.

## Audio

`npm run audio` generates every clip. Voices are set in `VOICES` in `scripts/audio/generate.ts`:

- **Indian English (default):** Priyanka's custom voice on [Fish Audio](https://fish.audio) (free `s2.1-pro-free` model), set slightly slower for a calm, friendly tone.
- **British:** macOS voice **Daniel**. **American:** macOS voice **Samantha**.

Fish Audio needs an API key in a git-ignored `.env.local` file (`FISH_API_KEY=...`). Without a key, existing Fish clips are kept and any new clip falls back to the macOS voice **Rishi**. If the account has paid API credit, every Fish clip is also transcribed back with Fish speech-to-text to confirm it says the right word, and story word timings come from the transcript. Otherwise only free length checks run. Anything suspicious is listed in `scripts/audio/review-<accent>.txt`.

Encoding uses macOS `afconvert`. Only new or changed text is regenerated. Output goes to `public/audio/<accent>/…m4a`, and timings go to `src/content/audio-manifest.json`.

**Isolated phonemes.** These voices can't say a bare sound reliably: "sss" comes out as "ess ess ess". So each phoneme is **cut out of a real carrier word** (`scripts/audio/dsp.ts`). Hissy sounds come from the start of a word (/s/ from *sun*). Hums are cut where the low-frequency energy drops (/m/ from *map*). Stops are cut just before the vowel, so /t/ is crisp, not "tuh". /b/ /d/ /g/ start at the release burst, and vowels come from words like *at*, *up* and *eat*. Continuous sounds are time-stretched (WSOLA) so children can hear them clearly.

**Please listen to every sound** on *For grown-ups → Sound check* before using SoundSteps with children. Automatic cutting is good but not perfect.

**Replacing clips with recordings.** Put a WAV file at `recordings/<accent>/<key>.wav`, for example `recordings/in/ph/s.wav` for /s/ or `recordings/gb/w/ship.wav` for the word "ship", then run `npm run audio`. Recordings always take priority over generated clips.

**Licensing.** The Indian English clips use Priyanka's own Fish Audio voice. Check Fish Audio's terms for the plan used to generate them. The British and American clips were produced with Apple's built-in voices; check that the macOS software licence permits your intended distribution before publishing widely. For a large public launch, consider replacing the clips with human recordings (above) or a TTS service whose terms allow redistribution.

**Fallbacks.** If a clip can't load, the app uses the device's own speech synthesis for words and sentences. Isolated sounds fall back to "s, as in sun" rather than a letter name. Captions always show what is being said, and muting keeps everything working.

## Deploying

SoundSteps is a static site with no backend, API keys or environment variables. Because it uses relative paths and hash routing, the same `dist/` folder works at any URL or sub-path.

**GitHub Pages (included):** push to `main`. `.github/workflows/deploy.yml` tests, builds and publishes. One-time setup: in the repository's *Settings → Pages*, set *Source* to **GitHub Actions**.

**Cloudflare Pages or Netlify:** build command `npm run build`, output directory `dist`, Node 20.

**Any web server:** run `npm run build` and upload `dist/`.

## Accessibility and safety

- Large touch targets, keyboard navigation and visible focus rings. Drag-and-drop tasks also work by tapping or with the keyboard.
- Captions for all speech. Respects *reduce motion*, with a "calm" setting for grown-ups. No flashing.
- Andika, a typeface designed for early literacy (single-storey *a* and *g*).
- No ads, chat, profiles, social features or external links in the children's area.
- Checks and games are practice, not formal assessments. They never label children.
