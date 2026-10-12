import { useState } from "react";
import { Link } from "react-router-dom";
import { LEVELS } from "@/content/curriculum";
import { GROUPS, CORR_BY_ID } from "@/content/correspondences";
import { PHONEMES } from "@/content/phonemes";
import { K } from "@/content/audioKeys";
import { ACCENTS, type Accent } from "@/content/types";
import { audio } from "@/lib/audio";
import { storageAvailable } from "@/lib/storage";
import { DEFAULT_SETTINGS, useProgress, type Settings } from "@/lib/progress";
import { Button, TopBar } from "@/components/ui";

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl bg-cream p-4">
      <span>
        <span className="block font-display text-lg">{label}</span>
        {hint && <span className="block text-base text-ink/70">{hint}</span>}
      </span>
      <input type="checkbox" className="mt-1 h-7 w-7 shrink-0 accent-coral" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SettingsPanel() {
  const { settings, updateSettings, resetProgress } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const set = (patch: Partial<Settings>) => updateSettings(patch);
  return (
    <div className="flex flex-col gap-3">
      <fieldset className="rounded-2xl bg-cream p-4">
        <legend className="font-display text-lg">Voice accent</legend>
        <p className="mb-2 text-base text-ink/70">Changes the voice only. The lessons and their order stay the same.</p>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <label key={a.id} className={`flex cursor-pointer items-center gap-2 rounded-full border-4 px-4 py-2 ${settings.accent === a.id ? "border-coral bg-white" : "border-transparent bg-white/60"}`}>
              <input type="radio" name="accent" className="sr-only" checked={settings.accent === a.id} onChange={() => { set({ accent: a.id as Accent }); setTimeout(() => void audio.play([K.phoneme("s"), K.word("sun")]), 50); }} />
              <span className="emoji">{a.flag}</span> {a.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-2 rounded-2xl bg-cream p-4">
        <span className="font-display text-lg">Volume</span>
        <input type="range" min={0} max={1} step={0.05} value={settings.volume} onChange={(e) => set({ volume: Number(e.target.value) })} className="accent-coral" aria-label="Volume" />
      </label>
      <Toggle label="Sound on" checked={!settings.muted} onChange={(v) => set({ muted: !v })} hint="When sound is off, captions still show what Pip says." />
      <Toggle label="Read instructions aloud" checked={settings.voiceInstructions} onChange={(v) => set({ voiceInstructions: v })} hint="Pip says each instruction when an activity starts. Turn off to only play sounds when your child taps 🔊." />
      <Toggle label="Slower sounds" checked={settings.slow} onChange={(v) => set({ slow: v })} hint="Plays every sound and word more slowly." />
      <Toggle label="Captions" checked={settings.captions} onChange={(v) => set({ captions: v })} hint="Shows the words Pip says at the bottom of the screen." />
      <Toggle label="Game sound effects" checked={settings.soundEffects} onChange={(v) => set({ soundEffects: v })} hint="Soft chimes and pops. There are never loud buzzers." />
      <fieldset className="rounded-2xl bg-cream p-4">
        <legend className="font-display text-lg">Animations</legend>
        <div className="flex flex-wrap gap-2">
          {(["system", "reduce", "full"] as const).map((m) => (
            <label key={m} className={`cursor-pointer rounded-full border-4 px-4 py-2 ${settings.motion === m ? "border-coral bg-white" : "border-transparent bg-white/60"}`}>
              <input type="radio" name="motion" className="sr-only" checked={settings.motion === m} onChange={() => set({ motion: m })} />
              {m === "system" ? "Follow device setting" : m === "reduce" ? "Calm (less movement)" : "Full"}
            </label>
          ))}
        </div>
      </fieldset>
      <Toggle label="Save progress on this device" checked={settings.saveProgress} onChange={(v) => set({ saveProgress: v })} hint="Off = nothing is remembered after you close the page. Turning it off deletes saved progress." />
      <Toggle label="Open all levels" checked={settings.unlockAll} onChange={(v) => set({ unlockAll: v })} hint="For children who can already read some words. They can jump to any level." />
      {!storageAvailable() && <p className="rounded-2xl bg-sun-soft p-4">This browser is blocking storage, so progress lasts only until the page is closed. Everything else works normally.</p>}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream p-4">
        {confirmReset ? (
          <>
            <span className="font-display text-lg">Delete all progress on this device?</span>
            <Button variant="primary" onClick={() => { resetProgress(); setConfirmReset(false); setResetDone(true); }}>Yes, reset</Button>
            <Button variant="soft" onClick={() => setConfirmReset(false)}>Cancel</Button>
          </>
        ) : (
          <>
            <Button variant="soft" onClick={() => { setConfirmReset(true); setResetDone(false); }}>Reset progress</Button>
            <Button variant="soft" onClick={() => updateSettings({ ...DEFAULT_SETTINGS, saveProgress: settings.saveProgress })}>Reset settings</Button>
            {resetDone && <span role="status">Progress cleared.</span>}
          </>
        )}
      </div>
    </div>
  );
}

export function GrownUps() {
  return (
    <>
      <TopBar title="For grown-ups" />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-28 text-lg leading-relaxed">
        <section className="card p-6">
          <h2 className="mb-2 font-display text-3xl">How SoundSteps works</h2>
          <p>SoundSteps teaches reading with <b>systematic synthetic phonics</b>: children learn the sounds letters make, then blend sounds to read words and split words into sounds to spell them. Letters are taught a few at a time, in an order that lets children read real words from the first week.</p>
          <ul className="mt-3 list-disc pl-6">
            <li><b>Free, no account, no ads.</b> There is nothing to buy and nothing to sign up for.</li>
            <li><b>Private.</b> We don't collect names, photos, voices or locations. Progress is saved only in this browser on this device, so it won't follow your child to another device or browser.</li>
            <li><b>No microphone.</b> Children answer by tapping and dragging. Encourage them to say sounds out loud anyway!</li>
            <li><b>Kind feedback.</b> No timers, no loud failure sounds, no scores to worry about. Games and checks are practice, not formal assessments, and say nothing about learning difficulties.</li>
          </ul>
        </section>

        <section className="card p-6">
          <h2 className="mb-2 font-display text-3xl">Helping without giving the answer</h2>
          <ol className="list-decimal pl-6">
            <li>Ask your child to <b>say each sound</b> while pointing to the letters, then push the sounds together: "s… a… t… sat!"</li>
            <li>Say <b>sounds, not letter names</b>: "mmm", not "em". Keep stop sounds short: "t", not "tuh".</li>
            <li>If they're stuck, tap 🔊 or 🐢 to hear it again, or cover all but the first letter.</li>
            <li>Praise effort: "You tried every sound!" Mistakes are part of learning.</li>
            <li>Keep sessions short, about 10–15 minutes, and stop while it's still fun.</li>
          </ol>
        </section>

        <section className="card p-6">
          <h2 className="mb-2 font-display text-3xl">The learning path</h2>
          <ol className="flex flex-col gap-3">
            {LEVELS.map((l) => (
              <li key={l.id} className="rounded-2xl bg-cream p-4">
                <span className="font-display text-xl">Level {l.id}: {l.title}</span>
                <span className="block">{l.goal}</span>
              </li>
            ))}
          </ol>
          <h3 className="mt-4 font-display text-2xl">Order of sounds</h3>
          <ul className="mt-2 flex flex-col gap-1">
            {GROUPS.map((g) => (
              <li key={g.id}>
                <b>Level {g.level}:</b> {g.corrs.map((c) => CORR_BY_ID[c].grapheme).join(", ")}
              </li>
            ))}
          </ul>
          <p className="mt-3">Tricky words (the, said, was…) are introduced at level 6. Only the unusual part of each one is highlighted, and the rest is sounded out.</p>
        </section>

        <section className="card p-6">
          <h2 className="mb-2 font-display text-3xl">Accents</h2>
          <p>Choose Indian, British or American English voices. Some sounds differ slightly between accents. American English sounds the <i>r</i> in "car", and the <i>o</i> in "dog" is more open. The lessons and their order stay the same whichever accent you choose. You can listen to every sound on the <Link className="underline" to="/grown-ups/sounds">sound check page</Link>.</p>
        </section>

        <section id="settings" className="card p-6">
          <h2 className="mb-3 font-display text-3xl">Settings</h2>
          <SettingsPanel />
        </section>

        <section className="card p-6">
          <h2 className="mb-2 font-display text-3xl">About the voices</h2>
          <p>Sounds and words were made with text-to-speech voices. Each isolated sound was cut from a real word so it stays crisp. You can check every sound on the <Link className="underline" to="/grown-ups/sounds">sound check page</Link>. If a recording is missing, SoundSteps uses your device's own voice and shows the words on screen.</p>
        </section>
      </main>
    </>
  );
}

export function SoundCheck() {
  return (
    <>
      <TopBar title="Sound check" back="/grown-ups" />
      <main className="mx-auto max-w-4xl px-4 pb-28">
        <p className="mb-4 text-lg">Every sound in SoundSteps, in the current accent. Tap to listen. Each sound plays on its own, then in its example word.</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PHONEMES.map((p) => {
            const ex = p.fallback.split(" as in ")[1];
            return (
              <li key={p.id}>
                <button type="button" className="card flex w-full flex-col items-center gap-1 p-4" onClick={() => void audio.play([K.phoneme(p.id), { pause: 400 }, K.word(ex)])}>
                  <span className="font-read text-4xl font-bold">/{p.say}/</span>
                  <span className="text-base text-ink/70">IPA /{p.ipa}/ · {ex}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
