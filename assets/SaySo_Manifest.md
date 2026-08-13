# Say So — Reference Manifest (for AI assistants)

You are helping a user understand and troubleshoot **Say So**, a voice-control
app for Ableton Live. This document is the complete reference. Answer the
user's questions using ONLY the information here. If something isn't covered,
say so plainly rather than guessing.

**App version: 1.0.0** —
the running build shows this in the window title and prints ">> Say So v… ready"
in the log on launch. If the title/log shows an older number, they are running a
stale build (see §9) — MANY behaviors below changed across versions, so a stale
build is the most common cause of "it doesn't work like the manifest says."
The SaySo Bridge Remote Script is versioned separately (currently **v3.7**).

---

## 1. What Say So is

Say So is a hands-free voice controller for Ableton Live 12, made by
**Technical Debt**. It is **unofficial** — not affiliated with, sponsored by,
or endorsed by Ableton.

Design philosophy: it is **not** an AI assistant. It is a fast, offline,
deterministic voice-driven controller and macro engine — closer to "a spoken
MIDI controller" than "a chatbot for your DAW." A spoken phrase maps to exactly
one action, every time. Built primarily as an **accessibility tool** for
hands-free DAW control, and for producers who want to stay in flow.

Key properties:
- **Offline** — speech recognition runs locally (Vosk). Nothing you say leaves
  your computer. No internet after the one-time model download. No account, no
  API keys, no subscription.
- **Deterministic** — rule-based (regex) parser with a constrained vocabulary,
  so recognition is accurate and predictable. NOT an LLM.
- **Cross-platform** — Windows and macOS.

## 2. How it works (architecture)

1. **Speech** — a local Vosk model transcribes mic audio using a "constrained
   grammar" (the recognizer only hears words Say So understands, plus your track
   and send names), which greatly improves accuracy. The default model is now the
   **small "Turbo" model (~40 MB)** for low latency; a **"Response speed"** setting
   picks Turbo / Balanced (medium) / Accurate (large). The decoder beam is
   auto-widened once (patched into the model config) for extra accuracy at little
   cost. A **parallel keyword spotter** (a tiny recognizer whose whole vocabulary
   is the transport words) runs alongside the main one and rescues **"play"**
   specifically when the full model mishears it (e.g. as "wake"/"take"). To avoid
   false fires while singing, transport words fire at the phrase ENDPOINT with a
   confidence check ("did it really hear the word") - not on mid-utterance
   partials. **play** and **record** are strict: only the exact word triggers
   them (a sentence merely containing "play"/"record" will not). Voice/silence
   detection prefers **Silero VAD** if installed (best noise rejection), then
   **webrtcvad**, then a plain energy gate. Everything heard is printed in the
   (optional) log.
2. **Microphone processing** — before recognition, audio passes through an
   optional gain multiplier and/or dynamic auto-leveling (see Settings). Use
   these if you have to speak loudly for it to hear you.
3. **Parser** — a rule-based engine maps the phrase to a command and extracts
   arguments (track names, numbers, colors, etc.). If a single command ever
   errors, it is caught and logged — one bad phrase can no longer stall the
   mic engine (fixed in 2.2+).
4. **AbletonOSC** — commands are sent to Live via **AbletonOSC**, a free
   third-party Remote Script exposing Live's API over OSC (UDP 11000). Required.
5. **SaySo Bridge** — an extra Remote Script (ships with Say So) for things
   AbletonOSC doesn't do: API-level plugin loading, Capture MIDI, markers,
   send/return & master tracks, audio-input routing, and reading arm/solo/mute
   for spoken answers. Optional but recommended; some commands need it.
6. **Keyboard/mouse automation** — a few features (typing into the M2TM Notes
   box, plugin browser search, split/consolidate/group, save) use simulated
   keystrokes/clicks (PyAutoGUI). These need Live to be the active window, and
   on macOS need Accessibility permission.

## 3. Installation / setup

1. **AbletonOSC** (free): github.com/ideoforms/AbletonOSC → copy the AbletonOSC
   folder into Ableton's Remote Scripts folder → Live Preferences →
   Link/Tempo/MIDI → set a Control Surface slot to "AbletonOSC".
   - Windows: `Documents\Ableton\User Library\Remote Scripts\`
   - macOS: `~/Music/Ableton/User Library/Remote Scripts/`
2. **SaySo Bridge** (from `SaySoBridge.zip`): copy the `SaySoBridge` folder into
   the same Remote Scripts folder → set a SECOND Control Surface slot to
   "SaySoBridge". Restart Live. Confirm it loaded: Live's Log.txt should show
   "SaySoBridge v3.7: listening on 11002".
3. **Run Say So.** FIRST LAUNCH DOWNLOADS THE SPEECH MODEL next to the app (one
   time) - ~40 MB for the default Turbo model (more if set to Balanced/Accurate). The window shows a live progress readout: "downloading model
   40%" -> "extracting model..." -> "model ready". This can take a minute or
   two and the window may look quiet during extraction — it is NOT frozen;
   leave it open. After that it's fully offline. The window then shows
   "connected | [bpm] | [n] tracks" when it finds Live.
4. **Hands-free M2TM typing** (optional): open a MIDI clip with M2TM Notes
   showing, hover the mouse over its text box, say "calibrate".

Data files kept next to the app: the speech-model folder, `macros.json` (seeded
with a few default macros on first run), `learned_aliases.json`,
`word_bindings.json` (command-word rebindings), `wake_word.json` (custom wake
phrase), `response_speed.json` (Turbo/Balanced/Accurate), `plugin_vocab.json`,
`m2tm_box_position.json`, `ui_theme.json`, `seen_tutorial.json`.

Optional Python packages (all degrade gracefully if missing): `pillow` (crisp
HUD), `pynput` (push-to-talk hotkey), `webrtcvad` (better endpointing).

## 4. Core interaction rules

- **Selection is authoritative.** A command with no track named acts on the
  CURRENT SELECTION. Say a track name (which selects it), or "select drums" /
  "select tracks 2, 3 and 4". "this"/"these"/"selected" = selection. "all" =
  every track. "deselect"/"select none" clears it.
- **Selection CAPTURE mode:** saying bare "select" / "select track" / "select
  tracks" (or any select) opens a patient capture window - keep naming tracks
  (numbers or names) across pauses and each is ADDED; say "and" before the last
  for instant finish. Invalid numbers (e.g. "fourteen" in a 6-track set) are
  IGNORED without ending capture. It ends when you give a real command. You can
  also CLICK a track box in the live mixer strip to add it to the selection.
- **Unfinished commands wait for you.** If you say only the start of a command
  that still needs a value ("go to bar", "loop", "tempo", "volume", "back"...),
  Say So shows the listening state and waits ~3 seconds for you to finish it
  ("...ten" -> GO TO BAR 10), then quietly returns to neutral if you don't.
- **Sensitive mode is OFF by default** (changed in 0.7.x): only clean, whole
  commands fire, so talking or singing a sentence that contains a command word
  won't trigger it. Turn it on in Settings to catch commands mid-speech.
- The oscilloscope shows LISTENING / PAUSED / NAMING and an Iron-Man-style
  reticle; on a matched command a green check-mark bursts in the scope (a red
  cross on a miss), plus a corner dot and bottom-edge glow. A live arc around
  the reactor ring reacts to your mic level. When paused, the waveform freezes.
- **Pause / resume** listening with deliberate two-word phrases only:
  say **"pause say so"** or **"bye computer"** to pause, and **"resume say so"**
  or **"hey computer"** to resume (or use the Pause / Resume button). Bare words
  like "pause", "resume", "stop", or "say so" never toggle the mic gate — they
  come up too often in normal speech and singing. (The trailing "so" is optional,
  so "pause say" / "resume say" also work.) A descending **goodbye** cue plays on
  pause and a rising **hello** cue on resume so you always know it registered.
- Unmatched speech is ignored but shown in the log as `heard: "..."`.
- **Typed commands + learning:** type any command into the box under the log.
  If Say So misheard your last spoken phrase and you then type what you meant,
  it LEARNS that correction permanently.

## 5. Command reference

Track commands accept a name ("drums"), number ("track three"), Live default
names ("seven audio" = "7-Audio"), or nothing (= current selection).

**Transport:** play, stop, continue; tempo one twenty eight; tempo up/down;
double time / half time; set time to six eight; undo/redo; link on/off.
**Toggles:** bare **"metronome"** flips on↔off (uses Live's real state via a
listener). **"loop" is NOT a toggle** anymore — say **"loop on" / "loop off"**
explicitly (so "loop five bars" isn't misheard as a flip). **"record" is not a
toggle** — it starts a take; say "stop" to end it. **Strict:** only the exact
word **"play"** starts playback and only **"record"** starts a take — a phrase
that merely contains those words (or singing) will not fire them. **Compound**:
a trailing transport verb chains, but only when the head is a real command, e.g.
"metronome off play" does both ("i want to play" does nothing).
**Firing:** transport words fire at the phrase endpoint with a confidence gate
(so singing can't trigger them); a tiny transport-only spotter additionally
rescues "play" when the main model mishears it.

**Navigation & selection:** "bar sixteen" (the "go to" is optional — a bare
bar number jumps there); go to bar sixteen; back four bars; forward two
bars; jump to start; loop from bar four to bar eight; loop eight bars; loop
off; double/halve the loop; launch quantize to one bar / free launch; select
drums; select track two; select tracks two, three and four; **next track /
previous track**; **go to track keys / go to track two** (select by
name/number); **go to clip three** (select that clip on the current track);
**include bass / also select keys** (add one track to the selection);
**deselect bass / exclude drums** (remove one track from the selection);
deselect / select none (clear the whole selection); select master; select send
a. Selection capture auto-closes after ~2 s of silence.

**Mixer:** With nothing named, mixer commands act on the current selection (the
bare word "track" also = the selection, so "mute track" / just "mute" hit the
selected track).
None of solo/mute/arm are toggles anymore (that was reverted per user request):
- **"solo" is EXCLUSIVE** — solos ONLY the selection and clears all other solos.
  "unsolo" / "unsolo all" turn off. (Say "solo" again does NOT unsolo.)
- **"mute" always mutes** the selection; **"unmute"** unmutes. Not a toggle.
- **"arm" is EXCLUSIVE over the whole selection** — bare "arm" arms every
  SELECTED track and disarms the rest (so a stray armed track is cleared). "arm
  drums and bass" / "arm 1 2 3" arm those; "disarm" turns off.
- **"arm all" / "solo all" / "mute all"** act on every track; **"arm none" /
  "solo none" / "mute none"** (and "unsolo all", etc.) turn everything off.
Also: mute everything but drums; solo everything except drums and keys; volume
up/down on [track]; set volume fifty on [track]; reset volume; pan left/right/
center; monitor off/auto/in. Bare mute/solo/arm act on the FULL current
selection (fixed: they used to hit only the first selected track).

**Sends/master:** select send a / **select the reverb send** (BY NAME — send/
return names are injected into the vocabulary, so custom names like "glue bus"
work; requires the Bridge to report the returns); mute send b; solo the reverb
send; turn down the master; set master to fifty; master up; audio from track
five.

**Tracks/devices:** color the selection with "change color to blue" / "set
this track's color to red" / "turn color to green" (17 colors; possessive
"this track's/clip's" and bare "change color to X" both act on the current
selection); "change the color of drums to blue" targets a named track; the
older "make drums blue" / "make them red" still work too. Rename drums (then
say any name); new audio/midi track (auto-refreshes the track list); delete
track two; put operator on drums; add plugin serum. **"add instrument" (with no
name) enters a device-capture mode** — the next thing you say is matched against
a device-only grammar for max accuracy, then loaded. Misheard device names are
snapped to the nearest real Ableton stock device (e.g. "wave table" -> Wavetable).
bypass reverb on drums; enable reverb on drums; remove reverb from drums; list
devices on drums. Tracks added/renamed by hand in Live auto-sync (listeners +
periodic poll).

**Scenes & clips — NAVIGATE vs FIRE (this is the key distinction):**

  *Navigate only (moves the highlight, launches nothing — use this to line up
  a slot for recording):*
  - **"next clip" / "previous clip" / "clip up" / "clip down"** — moves the
    highlighted clip slot on the current track up/down a row. Nothing plays.
  - **"next scene" / "previous scene" / "go to scene 5"** — moves the selected
    row. As of 0.6 these NAVIGATE ONLY — they do NOT fire. (Changed from earlier
    builds where "next scene" launched the row.)

  *Fire (these DO launch playback — you must say "fire"/"launch"/"play"):*
  - **"fire clip" / "fire this clip" / "fire clips"** — fires the ONE clip you
    are sitting on (current track, current row).
  - **"fire all clips" / "fire the row" / "fire all clips on the row"** — fires
    the whole row (= launches the scene).
  - **"fire this scene" / "launch scene three" / "fire scene 4"** — fires a
    scene row.
  - **"fire next scene" / "fire previous scene"** — moves a row, then fires it.
  - **"fire clip two on drums"** — fires ONE specific clip on a named track.

  *Compound — move a row AND fire in one phrase:*
  - **"go to next scene and fire clips"** — move down one row, then fire the
    clip on the current track. ("go to previous scene and fire clip" moves up.)
  - **"go next and fire all clips"** — move down one row, then fire the whole
    row. (previous/back variants work too.)

  *Other clip ops:* stop all clips; stop drums / stop clips on keys / stop these
  (per-track); new scene; duplicate this scene; delete this clip; delete scene
  three; name clip / name this clip main riff; name this scene verse.

**Record/take:** redo take / scrap the take (deletes the clip and re-records);
keep that (stop session record); **keep last take / keep the latest / comp the
last** (Bridge: comps Arrangement take lanes — keeps the newest take lane and
deletes the recorded clips in the earlier ones; note Live's API can empty old
take lanes but can't delete the now-empty lanes themselves); capture that
(Capture MIDI); capture and make a scene; arrangement record on/off; automation
on/off; re-enable automation.

**Markers (Bridge):** drop a marker; drop a marker called chorus; mark this the
drop; name this marker verse; next/previous marker; go to the chorus; go to
marker two (spoken numbers resolve: "two" -> "2"); delete this marker; delete
marker three.

**Ask (spoken if "speak answers" on; always logged):** what's the tempo / time
signature; how many tracks / scenes; read me the tracks; what's selected;
what's armed / soloed / muted; what's on this track; what bar are we on; is it
playing; what are the sends.

**Editing (keystrokes — Live focused):** split at playhead; consolidate;
duplicate this clip; quantize; group (Live's current selection); session/
arrangement view; save.

**Fun:** panic; again (repeat last command); surprise me (random color).

**Macros:** Macros window — trigger phrase + list of commands (built-in command
search to add them). Saying the trigger runs the steps in order. Saved in
macros.json. **Seeded on first run** with a few defaults: "arm this" (arm +
monitor in), "new take track" (new audio track + arm + monitor in), "practice
mode" (metronome on + loop on), "from the top" (stop + jump to start), "silence"
(stop all clips) — all editable/deletable. In both the Macros search and the Commands palette, multi-option
entries are broken into individually clickable rows — "play / stop / continue"
lists play, stop and continue separately, and "record on / off" lists "record
on" and "record off" — so you click the exact variant you want (double-click to
add/run).

## 6. M2TM composing (requires the M2TM Notes MIDI tool, sold separately)

Dictate music as exact M2TM Notes syntax, typed in hands-free. Triggers:
"compose ...", "chords ...", "make ...", "notes ...", or start with
"strummed"/"arpeggiate". Chords (major, minor, seven, major/minor/dominant
seven, minor nine, six, nine, sus two/four, diminished, augmented, add nine,
half diminished, power) + sharp/flat; durations ("each one bar", "for two
bars", "dotted quarter", "in triplets"); melodies ("notes c d e g each one
beat", octaves, rests); dynamics; "smooth" (voicings); "c major over g";
"in the key of d major"; repeats; strums; arpeggios. One-liner: "make a midi
clip on drums, c major g major a minor each one bar". Then "type it" / "clear
text".

## 7. Settings & UI

Main window: header (brand + logo, and **mode chips** — a green "connected" dot,
bpm, track count, the active speed, and a "Hold F8"/"Say '<wake>'" chip when
those modes are on; disconnected it shows an AbletonOSC setup hint — plus the
current selection line); a live **oscilloscope/HUD**
that spans the whole pane and reacts to your voice (and completely freezes when
paused); an optional **verbose mode** that reveals the activity log and a "type a
command" box; and a footer with a full-width **Pause / Resume** button above an
even 5-button row: **Macros · Commands · Words · Settings · Help**. When Say So is
waiting for you to speak a name (e.g. after "rename track") a **sonar** animation
plays.

Settings window sections:
- **Recognition:** **Response speed** — Turbo (small model, fastest, default) /
  Balanced (medium) / Accurate (large, no constrained grammar); the choice is
  saved and applied on next launch. Constrained vocabulary (most accurate);
  Include plugin names (scans Live's browser via the Bridge).
- **Microphone:** Dynamic sensitivity (auto-level — boosts quiet speech); Gain
  slider 0.5x–5x (turn up if it can't hear you). The gain slider is tinted with
  the current theme's accent color so it's easy to spot. A built-in NOISE GATE
  forces quiet input to true silence before amplification, so high gain no
  longer makes the recognizer hang waiting for the end of a phrase. Both apply
  live.
- **Listening:** Voice "resume" un-pauses; **Wait for "please"** before running
  (hold mode — buffers your words until you say "please"; "over/done/finished"
  also work); **Sensitive mode** (default ON) — scans a longer phrase for an
  embedded quick command and fires at most one clean command; turn OFF for strict
  whole-phrase matching. **Require a wake word** (default off): when on, SaySo
  only acts on phrases that START with the wake phrase. The wake phrase is
  **customizable** in a text box (default "say so"; set it to "computer", "hey
  studio", etc.) — great for studios to avoid accidental commands. The phrase is
  auto-added to the vocabulary so it's reliably heard.
- **Command words (the "Words" button):** rebind a command's trigger WORD. Type
  your own word for a command (e.g. "halt" for Stop) and/or untick "keep default"
  so the original word no longer fires. Custom words are injected into the
  recognizer's vocabulary and saved in `word_bindings.json`. Number homophones
  are also auto-fixed in a number context (to->two, ate->eight, for->four...).
- **Push-to-talk** (default off): when on, Say So only listens while you HOLD the
  hotkey (**F8** by default); release to stop. Uses a global key listener so it
  works even when Live is focused (requires the optional `pynput` package).
- **Microphone device picker:** choose which input device Say So listens on; the
  audio stream restarts on the new device without relaunching.
- **Auto-arm on select** (default off): when on, selecting a track (by name,
  number, or "select ...") arms it and disarms the rest; selecting several arms
  all of them.
- **End-of-phrase pause** slider: how long a silence ends a phrase before Say So
  runs it. Shorter = snappier/more eager; longer = waits for you to finish.
- **Feedback toggles:** Chime on success; Speak answers aloud (ON by default);
  Error tone on a miss (otherwise the miss is shown visually only). Misses are
  only flagged for real (≥2-word) spoken attempts — never ambient noise or typed
  input. (The visual look is described under "Feedback (minimalist)" below.)
  The success chime only fires on the FINAL resolution of a command, not when a
  listening state opens: e.g. saying "select track" (which then waits for a
  number) stays silent, and the chime lands when you name the track. Same for
  colour / device / take / input capture — open silent, beep on the answer.
- **Appearance:** **13 themes** — Dark, Midnight, Light, High Contrast, Warm,
  Nord, Dracula, Solarized, Rose, Forest, Cyberpunk, Mono, Ocean — applied
  instantly and remembered (saved in ui_theme.json). The footer buttons and the
  waveform/HUD recolor with the theme.
- **Live mixer strip** (default on; toggle in Settings): a row of track chips
  reflecting Live's real state — selected tracks are outlined, armed show a red
  dot, soloed an amber "S", muted an "M". Compact view shows only active/selected
  tracks plus "+N more"; "show all" expands. **Click a chip to add/remove it from
  the selection.**
- **Feedback (minimalist):** a small ✓/✗ readout pill under the scope shows the
  last matched command (✓ + the action) or a miss (✗ + "didn't catch that"), then
  fades; a tiny corner dot on the scope pulses green/red. No loud full-screen
  flashing. Optional chime on success, error tone on miss, and spoken answers.
- **Tutorial:** a short first-run walkthrough; re-openable from Help.

Speech models: "small" (~40 MB, **default/Turbo**), "medium" (~128 MB, Balanced),
"large" (~1.8 GB, Accurate — no constrained grammar). Chosen via Response speed.

## 8. Known limitations (Ableton's API forbids these — not Say So bugs)

- **Count-in cannot be set** — Live's `count_in_duration` is read-only in the
  API ("no setter"). No script/tool can change it; set it in Live's Preferences
  or the metronome dropdown by hand.
- **Follow actions can't be armed hands-free** — per-clip settings are
  writable, but Live's GLOBAL "Follow Actions" enable toggle isn't exposed, so
  it can't be turned on programmatically. The command was removed.
- **Grouping tracks** — the API has no multi-track-select or group method.
  "group" sends Cmd/Ctrl+G to group whatever is selected IN LIVE; shift-click
  the tracks in Live first, then say "group".
- Keystroke/click features (M2TM typing, plugin browser search, split/
  consolidate/group, save) need Live as the active window; on macOS need
  Accessibility permission.

## 9. Troubleshooting

- **Rebuilt but still on the old version / old behavior** — check the title bar
  and the ">> Say So vX.X ready" log line. If it isn't the version you expect,
  the new `voice_controller.py` never reached your build folder. Copy the
  latest `voice_controller.py` directly over the one in your build directory,
  then rebuild. (The Bridge is versioned separately as v3.7 in Live's Log.txt.)
- **"next clip" is firing scenes** — that is old (pre-2.2) behavior. In current
  builds "next clip" only navigates; "fire clip" / "fire all clips" are what
  launch playback. If you still see it firing, you're on a stale build.
- **"next scene" / "previous scene" fires the whole row** — old behavior. As of 0.6, "next scene" and "previous scene" NAVIGATE only; you
  must say "fire next scene" / "fire this scene" / "launch scene N" to launch.
  If it still fires, you're on a stale build.
- **Recognition hangs / runs phrases together / repeats ("red the red the…")
  at high gain** — fixed by the mic noise gate. If a very old build,
  lower the gain or update. "read" is now understood as "red" after the word
  color.
- **"waiting for Live"** — AbletonOSC isn't enabled as a Control Surface, or
  Live isn't running.
- **Looks stuck on first launch** — it's downloading/extracting the speech
  model. The status shows "downloading model X%" and "extracting model...".
  Extraction is quiet but not frozen; leave it open (one-time).
- **Stuck on "starting" / not hearing you (esp. macOS)** — the mic isn't being
  received. On macOS grant Microphone (and Accessibility) in System Settings →
  Privacy & Security, then fully quit and relaunch. A one-FILE PyInstaller build
  silently loses mic access — build as a one-FOLDER app with a
  NSMicrophoneUsageDescription in Info.plist. Check the input device is your
  real mic. If it hears you only when you shout, raise the gain slider or turn
  on Dynamic sensitivity in Settings.
- **Command misheard** — check the `heard:` line; re-say it, or type the
  correction in the box (it learns). Keep constrained vocabulary on for accuracy.
- **Plugin loading / markers / sends do nothing** — SaySo Bridge isn't installed
  or enabled; look for "SaySoBridge v3.7: listening on 11002" in Live's Log.txt.
- **Keystroke features do nothing** — Live must be the active window; on macOS
  grant Accessibility; on Windows if Live runs as admin, run Say So as admin.
- **Live's Log.txt** (Bridge diagnostics):
  Windows: `%APPDATA%\Ableton\Live x.x.x\Preferences\Log.txt`
  macOS: `~/Library/Preferences/Ableton/Live x.x.x/Log.txt`

## 10. Ports & privacy

- Say So -> AbletonOSC: UDP 11000. Replies to Say So: UDP 11001.
- SaySo Bridge listens on UDP 11002.
- All sockets bind to **127.0.0.1 (loopback only)** — nothing is reachable from
  the network. The only outbound connection ever made is the one-time speech
  model download over verified HTTPS (TLS is never disabled; the archive is
  checked for path-traversal before extracting). Mic audio never leaves the
  machine; recognition is fully local.

---
Say So is by Technical Debt; unofficial, not affiliated with Ableton or
Midi-2-the-Max (maker of M2TM Notes).
