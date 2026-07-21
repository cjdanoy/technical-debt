# Say So — Reference Manifest (for AI assistants)

You are helping a user understand and troubleshoot **Say So**, a voice-control
app for Ableton Live. This document is the complete reference. Answer the
user's questions using ONLY the information here. If something isn't covered,
say so plainly rather than guessing.

---

## 1. What Say So is

Say So is a hands-free voice controller for Ableton Live 12, made by
**Technical Debt**. It is **unofficial** and not affiliated with, sponsored by,
or endorsed by Ableton.

Design philosophy: it is **not** an AI assistant. It is a fast, offline,
deterministic voice-driven controller and macro engine — closer to "a spoken
MIDI controller" than "a chatbot for your DAW." A spoken phrase maps to exactly
one action, every time. It was built primarily as an **accessibility tool** for
hands-free DAW control, and also for producers who want to stay in flow.

Key properties:
- **Offline** — speech recognition runs locally (Vosk). Nothing you say leaves
  your computer. No internet needed after the one-time model download. No
  account, no API keys, no subscription.
- **Deterministic** — rule-based (regex) command parser with a constrained
  vocabulary, so recognition is accurate and predictable. It is NOT an LLM.
- **Cross-platform** — Windows and macOS.

## 2. How it works (architecture)

1. **Speech** — a local Vosk model transcribes your microphone audio. By
   default it uses a "constrained grammar": the recognizer is only allowed to
   hear words Say So understands (plus your track names), which greatly improves
   accuracy. Everything it hears is printed in the app's log window.
2. **Parser** — a rule-based command engine matches the transcribed phrase to a
   command and figures out arguments (track names, numbers, colors, etc.).
3. **AbletonOSC** — Say So sends commands to Ableton via **AbletonOSC**, a free
   third-party Remote Script that exposes Live's API over OSC (UDP port 11000).
   This must be installed and enabled for Say So to work.
4. **SaySo Bridge** — an additional Remote Script (shipped with Say So) that
   handles things AbletonOSC doesn't: API-level plugin loading, Capture MIDI,
   markers/locators, send/return & master tracks, audio-input routing, and
   reading arm/solo/mute state for spoken answers. Optional but recommended;
   some commands need it.
5. **Keyboard/mouse automation** — a few features (typing into the M2TM Notes
   box, plugin browser search, split/consolidate/group, save) use simulated
   keystrokes/clicks via PyAutoGUI. These require Live to be the active window
   (and on macOS, Accessibility permission).

## 3. Installation / setup

1. **Install AbletonOSC** (free): download from
   github.com/ideoforms/AbletonOSC, copy the `AbletonOSC` folder into
   Ableton's Remote Scripts folder, then in Live: Preferences → Link/Tempo/MIDI
   → set a free Control Surface slot to "AbletonOSC".
   - Windows Remote Scripts path: `Documents\Ableton\User Library\Remote Scripts\`
   - macOS Remote Scripts path: `~/Music/Ableton/User Library/Remote Scripts/`
2. **Install SaySo Bridge** (from the `SaySoBridge.zip` that ships with Say So):
   copy the `SaySoBridge` folder into the same Remote Scripts folder, then set a
   SECOND Control Surface slot to "SaySoBridge". Restart Live.
3. **Run Say So** (the app / SaySo.exe / SaySo.app). First launch downloads a
   ~128 MB speech model next to the app (one time). The window shows
   "connected | [bpm] | [n] tracks" when it finds Live.
4. **Hands-free M2TM typing** (optional): open a MIDI clip with the M2TM Notes
   tool showing, hover the mouse over its text box, say "calibrate". Remembered.

Data files Say So keeps next to itself: the speech-model folder, plus
`macros.json`, `learned_aliases.json`, `plugin_vocab.json`,
`m2tm_box_position.json`, `ui_theme.json`.

## 4. Core interaction rules

- **Selection is authoritative.** A command with no track named acts on the
  CURRENT SELECTION. If nothing is selected, track commands do nothing (and say
  "no track selected"). Say a track name (which selects it), or "select drums" /
  "select tracks 2, 3 and 4" first. "this"/"these"/"selected" = selection.
  "all"/"everything" = every track. "deselect"/"select none" clears it.
- The status dot **blinks red** while actively listening (like a record light).
- Say **"pause"** to stop listening (e.g. while recording vocals), "resume" to
  continue. There's also a Pause button.
- Random speech that matches no command is ignored but shown in the log as
  `heard: "..."`.
- **Typed commands + learning:** you can type any command into the ">" box. If
  Say So misheard your last spoken phrase and you then type what you meant, it
  LEARNS that correction permanently.

## 5. Command reference (what actually works)

Track commands accept a name ("drums"), a number ("track three"), Live's
default names ("seven audio" = "7-Audio"), or nothing (= current selection).

**Transport / song:** play, stop, continue; record on/off; tempo one twenty
eight; tempo up/down; double time / half time; set time to six eight;
metronome on/off; loop on/off; undo / redo (also "undo five times", "undo
everything"); link on/off; link sync on.

**Navigation / loop:** go to bar sixteen; back four bars; forward two bars;
jump to start; loop from bar four to bar eight; loop eight bars; loop off;
double/halve the loop; launch quantize to one bar / free launch; follow.

**Mixer:** mute/unmute, solo/unsolo, arm/disarm [track]; arm only drums; solo
only bass; unsolo all / unmute all / disarm everything; mute everything but
drums; solo drums and bass; solo everything except drums and keys; volume
up/down on [track]; set volume fifty on [track]; reset volume; pan
left/right/center; monitor off/auto/in.

**Selection:** select drums; select track two; select tracks two, three and
four; deselect / select none; select master; select send a.

**Sends/master:** select send a / select the reverb return; mute send b; solo
the reverb send; turn down the master; set master to fifty; master up; audio
from track five (sets the selected track's input to come from track 5).

**Tracks/devices:** make drums blue / color blue / make them red (17 colors);
rename drums (then say any name); new audio/midi track; delete track two (undo
restores); put operator on drums; add plugin serum; bypass reverb on drums;
enable reverb on drums; remove reverb from drums; list devices on drums.

**Scenes/clips:** launch scene three; next/previous scene (next clip = next
scene); fire clip two on drums (fires ONE clip on that track); stop all clips;
stop drums / stop clips on keys / stop these (per-track); new scene; duplicate
this scene; delete this clip; delete this scene; delete scene three; name clip
/ name this clip main riff; name this scene verse.

**Record/take:** redo take / scrap the take (deletes the clip and re-records);
keep that; capture that (Capture MIDI); capture and make a scene; arrangement
record on/off; automation on/off; re-enable automation.

**Markers (need the Bridge):** drop a marker; drop a marker called chorus; mark
this the drop; name this marker verse; next/previous marker; go to the chorus;
go to marker two (spoken numbers resolve: "two" -> "2"); delete this marker;
delete marker three.

**Ask (spoken answers if "speak answers" is on; always logged):** what's the
tempo / time signature; how many tracks / scenes; read me the tracks; what's
selected; what's armed / soloed / muted; what's on this track; what bar are we
on; is it playing; what are the sends.

**Editing (keystrokes — Live must be focused):** split at playhead; consolidate;
duplicate this clip; quantize; group (groups Live's current selection — see
limitations); session/arrangement view; save.

**Fun:** panic (stop + kill clips + disarm); again (repeat last command);
surprise me (random color).

**Macros:** open the Macros window, give a trigger phrase and a list of
commands (one per line; there's a built-in command search to add them). Saying
the trigger runs all steps in order. Example — trigger "practice mode":
loop 8 bars / metronome on. Macros are saved in macros.json.

## 6. M2TM composing (requires the M2TM Notes MIDI tool, sold separately)

Say So can dictate music as exact M2TM Notes syntax and type it in hands-free.
Triggers: "compose ...", "chords ...", "make ...", "notes ...", or start with
"strummed"/"arpeggiate". Supports: chords with qualities (major, minor, seven,
major seven, minor seven, dominant seven, minor nine, six, nine, sus two/four,
diminished, augmented, add nine, half diminished, power) + sharp/flat;
durations ("each one bar", "for two bars", "each two beats", "dotted quarter",
"in triplets"); melodies ("notes c d e g each one beat", octaves, rests);
dynamics ("loud", "softly"); "smooth" (pianist voicings); "c major over g"
(slash chords); "in the key of d major"; repeats ("four times"); strums
("strummed", "slowly", "subtle", "strummed up"); arpeggios ("arpeggiate", down,
up and down, random, "in eighths", "over two octaves"). One-liner:
"make a midi clip on drums, c major g major a minor each one bar" creates the
clip and types the syntax. Then "type it" / "clear text".

## 7. Settings & UI

Footer buttons: pause, refresh, macros, commands (searchable lookup), settings.
Settings window groups: Recognition (constrained vocabulary; include plugin
names in vocab — scans Live's browser via the Bridge), Listening (voice
"resume"; wait-for-"over" before running a command), Feedback (chime on
success; speak answers aloud), Appearance (5 accessible themes: Dark, Midnight,
Light, High Contrast, Warm — applied instantly and remembered).

Speech models: configurable at the top of the script — "small" (40 MB, fastest),
"medium" (128 MB, default, accurate), "large" (1.8 GB, best but no constrained
vocab).

## 8. Known limitations (things Ableton's API does NOT allow — not Say So bugs)

- **Count-in cannot be set** — Live's `count_in_duration` property is read-only
  in the API ("no setter"). No script/tool can change it. Set it manually in
  Live's Preferences → Record/Warp/Launch, or the metronome dropdown.
- **Follow actions can't be armed hands-free** — per-clip settings can be
  written, but Live's GLOBAL "Follow Actions" enable toggle is not exposed in
  the API, so it can't be turned on programmatically. Command was removed.
- **Grouping tracks** — Live's API has no multi-track-select or group method.
  "group" sends Cmd/Ctrl+G to group whatever is selected IN LIVE, so shift-click
  the tracks in Live first, then say "group".
- Keystroke/click features (M2TM typing, plugin browser search, split/
  consolidate/group, save) need Live to be the active window; on macOS they
  need Accessibility permission.

## 9. Troubleshooting

- **"waiting for Live"** — AbletonOSC isn't enabled as a Control Surface, or
  Live isn't running.
- **Stuck on "starting" / not picking up voice (especially macOS)** — the mic
  isn't being received. On macOS this is almost always a permissions issue:
  grant Microphone (and Accessibility) to the app in System Settings → Privacy
  & Security, then fully quit and relaunch. If running from a one-file build,
  rebuild as a one-FOLDER app (PyInstaller without --onefile) with a
  NSMicrophoneUsageDescription in Info.plist, or macOS silently denies the mic.
  Also check the input device is your real mic (System Settings → Sound → Input).
  Toggling pause/resume re-opens the audio stream, which is why it sometimes
  flips to "listening" — but if the OS is denying the mic, no audio arrives.
- **A command misheard** — check the `heard:` line in the log; re-say it, or
  type the correction in the ">" box (it learns). Turn on constrained vocabulary
  for best accuracy.
- **Plugin loading / markers / sends do nothing** — the SaySo Bridge isn't
  installed or enabled; check for "SaySoBridge: listening on 11002" in Live's
  Log.txt.
- **Typing/keystroke features do nothing** — Live must be the active window;
  on macOS grant Accessibility; if Live runs as admin on Windows, run Say So as
  admin too.
- **Live's Log.txt** (for Bridge diagnostics):
  Windows: `%APPDATA%\Ableton\Live x.x.x\Preferences\Log.txt`
  macOS: `~/Library/Preferences/Ableton/Live x.x.x/Log.txt`

## 10. Ports & files

- OSC send to AbletonOSC: UDP 11000. Replies to Say So: UDP 11001.
- SaySo Bridge listens on UDP 11002.
- If a port is busy, that's a conflict with another OSC tool.

---
End of manifest. Say So is by Technical Debt; unofficial, not affiliated with
Ableton or Midi-2-the-Max (maker of M2TM Notes).
