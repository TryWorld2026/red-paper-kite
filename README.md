# Red Paper Kite · 红纸鸢 · 归名

A Chinese-horror text adventure. Single route, completable in one playthrough, and all of the horror carried by the writing.

The 23rd year of the Republic, Huaiyin Village in eastern Zhejiang. You have come to fetch a bride, and no one will tell you where she is. The stone marker at the village entrance is covered with red paper, bearing a single line:

> The bride has not arrived; the groom may not return.

You must find her before dawn. And the first of the three rules the matchmaker gave you is this — do not speak her name.

![License](https://img.shields.io/badge/license-MIT-C0452F?style=flat-square)
![Zero dependencies](https://img.shields.io/badge/dependencies-none-2E5E8C?style=flat-square)

<a href="README.zh-CN.md"><strong>简体中文（原文）</strong></a>

> **On this translation**: the game's central mechanic is Chinese naming custom — the three kinds of name a woman can be recorded under (`父名` a name given by her father, `夫名` one given by her husband, `自名` one she wrote for herself) and the ritual propriety (`礼数`) that governs who may speak and when. Both are kept in Chinese with an explanation at first use, because translating them would erase the thing the game is about. The [Simplified Chinese version](README.zh-CN.md) is the original.

## Core design

The rules are not obstacles; the rules are her corpse. The player hunts for rules in order to carry off the missing bride, and eventually discovers that the rules have been completing this wedding on his behalf all along.

What this game actually takes from you is **your own right to speak**.

- **No sanity, no yin meter.** No survival stats, no progress bar, no game-over dialog.
- **Two hidden states**:
  - `rite` (ritual permeation, 0–5) — the number is never displayed, but it drives gate-wording erosion, interface failure, and node usurpation
  - `evidence` (name evidence, three kinds: father's / husband's / self-given) — decides what she is ultimately called
- **The form of address is the horror**: from permeation 2 onward, every "she" in the prose is replaced by whichever form of address you have used most; the wording of the options begins reciting for you in the tone of ritual propriety. At full permeation, even the narration stops saying "you".
- **Transgression leaves a record**: answering the voice outside, or lifting the sedan curtain — the cost is not a stat drop but an irreversible trace. The first time she appears she addresses you in the exact tone of that one word you used; by the hour of the Tiger you will notice the blank on the memorial tablet already carries a stroke you did not write.
- **The ledger** (the courtyard, "lower your head and read your own marriage contract"): every transgression and every instance of being written for you lands here as a line you can check. This surface is **always honest** — rewritten evidence does not count as evidence.
- **Layered interface failure**: the top bar and relic row change their wording as permeation rises (save → record name), but the main menu and the ending record are the last anchors of reality, failing only at extreme permeation or after you have been written for.
- **Wording changes, power does not**: erosion only rewrites displayed text and never touches what an option points to, the gates, or the ending conditions — you always make the choice you meant to make; only the voice speaking it changes. The single exception is node usurpation, which comes in two forms: **declared proxy** ("Silence. The matchmaker will write it for you" — the option states who is writing, so choosing it always enters the ledger) and **silent takeover** (you think you are only reading ritual phrasing while it has already taken over — requires both warnings to be shown and permeation high enough).
- **Recovering her agency**: proving you found a person rather than a wedding — watch whether she asks you a question. Anything the player says out loud (a correction to her, the confession in "Loss of Name") may not be taken over by the ritual.

## Playing

The project needs no dependencies and no build step.

```bash
node server.js
```

Then open `http://localhost:8080`. You can also open `index.html` directly, but the local server is better for testing audio and save behavior.

## The three rules

| Rule | If you keep it | If you break it | Where the bill lands |
| --- | --- | --- | --- |
| When you hear your name called from outside, do not answer | It never learns to answer for you | It starts answering for you | At the first meeting, she no longer recites the ritual phrasing and instead calls you in the tone of that one word you used |
| When the sedan curtain falls, do not lift it | The blank marriage contract will not fill in your name | Both names on it become yours | At the hour of the Tiger, standing at the tablet, you discover the blank already carries a stroke, written right to left |
| Before dawn, do not speak her old name | The name is finished for you by someone else | You can say the one character she wrote for herself | — |

All three rules are "for the living's sake." If a rule did not protect people, why would it be written down at all.

The cost of transgression is not a stat drop but **an irreversible trace**: it changes the text you read from then on, and every line is recorded in the margin of the marriage contract (the courtyard, "lower your head and read your own marriage contract"), checkable at any time.

## The three endings

The ending is not decided by a score. It is decided by **what you called her**.

- **"Return to Her Registry" (归籍)** — You send her back to her natal home. She does leave the Chen household, only to be taken to another door that keeps household registration. She says: you sent me back. Thank you.
- **"The Proper Marriage" (正婚)** — You say "new bride of the Chen door" and every contradiction suddenly resolves. The matchmaker praises you as the most etiquette-minded groom. A month later a wedding invitation arrives, and the sender's line is in your own handwriting. **Compliance being rewarded is the most frightening thing in this game.**
- **"Loss of Name" (失讳)** — You say only the single character she wrote for herself. For the first time she does not recite the ritual phrasing but asks you: "If you remembered me, why did you still want to marry me?" — remembering is also a form of possession.

**Before naming, two kinds of propriety must be satisfied first** (answering a call, and the ancestral-hall tablet interrogation — one each). Holding the evidence but having performed no propriety at all gets you nothing but a visible, unclickable line in the courtyard: "Not one rite performed; it is not your turn to speak." This is not a gate, it is the theme — ritual does not advance through transgression, it advances through submission.

Standing before the tablet, even a groom who knows no name at all still has one path: stay silent and let the matchmarker write it for you. That is "The Proper Marriage."

## Project structure

```text
index.html        page structure, menus, event bindings
style.css         xuan-paper and antique-book visuals, ritual permeation atmosphere layer
server.js         zero-dependency Node.js static server

js/
  chapter-v3.js   chapter one script data (20 scenes) + scene compiler, wording erosion, ending table, save normalization
  core.js         engine: state, saves, typewriter rendering, hour-of-day, layered interface erosion, endings and ending record
  items.js        the five relics (objects are fragments of forms of address)
  sound.js        Web Audio effects and background music

docs/
  refactor-design.md   v3 redesign contract (premises, hidden states, definition of done)

tests/
  regression.js        18 regression assertion groups
  mutation-check.js    39 mutants, verifying the regression suite actually goes red

shiver.mp3        background music
网站二维码.png    project QR code image
```

The script is data-driven: every scene in `CHAPTER_V3` declares `text.first` / `text.again`, options carrying `condition` and `once`, and `effects` (flag / evidence / relic / ritual permeation). `compileScene` compiles it into a `run()` the engine can consume. Writing a new chapter means adding data, not changing the engine.

On arrival, the hour advances **monotonically** according to the `HOUR_OF` table; no path ever winds the clock back.

## Tests

### Regression tests

```bash
node tests/regression.js
```

Covers 18 groups of assertions aimed at the mines unique to text adventures — zero-option dead ends, gated locks, stat leakage — and at whether this round's new "author's rights" mechanism actually bears weight:

1. Scene-graph static invariants: no dangling jumps, no scene whose options are all one-time, every scene reachable from the start, **no dead end before an ending** (checked by transitive closure), **still able to return to the village entrance after entering the house**, all three endings have an entrance
2. Still able to leave after one-time options are exhausted (worst state constructed per scene)
3. All three endings directionally reachable (including the silent fallback route where "nothing was investigated")
4. Name-seeking progress gates: evidence and propriety are **two gates, each independently effective**, the locked explanation while propriety is unperformed is visible and unclickable, keeping only to the rules opens the gate with two rites, evidence is capped and cannot be farmed, repeatable options cannot farm hidden state, a misclick on naming can be undone to gather more evidence
5. Design contract: no `san`/`yin` in state, no survival-stat wording anywhere on screen, permeation appears only through class names and wording, appended sentences may not reintroduce a bare "she"
6. Render determinism: the same state rendered twice under multiple permeation levels is character-for-character identical (temporarily swapping `Math.random` for an alternating threshold-crossing sequence to expose any coin-flip implementation)
7. Form-of-address permeation: text is rewritten across the threshold, and the replacement does not break HTML tags
8. Differential text on revisit
9. Hour monotonicity (five routes plus randomized playback)
10. Save normalization: dirty types, out-of-range values, illegal scene ids, unknown relic ids; the starting point does not overwrite existing progress
11. All five relics obtainable within a single run, without duplicates
12. Author's-rights erosion: from permeation 2 onward narrative options are reworded but **keep their target and effect**, words the player speaks out loud are not taken over, full permeation rewords the prose, and HTML tags survive
13. The ledger (the margin of the marriage contract): the ledger page is always honest, always has an exit, leaves a line per transgression, and a real revisit compares line counts (if unchanged it says so plainly)
14. Node usurpation thresholds: **declared proxy always enters the ledger when chosen** (even with zero warnings and zero permeation), **silent takeover requires both warnings plus sufficient permeation**, and once it happens it enters the ledger and shakes the anchors
15. Layered interface erosion: the top bar changes its wording while its behavior is untouched, anchors fail only at extreme permeation or after being written for and are restored on a new run, relic-row wording changes with permeation while the relics themselves do not
16. The irreversible cost of transgression: answering outside and lifting the curtain each change later text but **do not change which endings are reachable**
17. 500 randomized playthroughs: no dead ends, no non-convergence, all three endings reachable even randomly, printing the **ending distribution** as an observable (if the compliance ending became the overwhelming default, this shows it directly)
18. DOM contract and accessibility: every id referenced by a script must actually exist in `index.html` (the stub would conjure elements out of nothing, and this class of bug stays green under logic tests forever); zoom/meta/og/favicon/focus ring/reduced motion may not be removed; locked items must genuinely carry `aria-disabled` at the render layer with no click handler attached

### Mutation testing

```bash
node tests/mutation-check.js
```

All green does not mean the tests are effective. This script first breaks each key behavior of the v3 engine one at a time, then asserts that the regression suite must go red, and that it goes red on the section that owns it:

| Group | Mutants |
| --- | --- |
| Structural dead ends | The only navigation option marked one-time, the brazier missing its step-back fallback, naming losing the silent fallback |
| Gates and progress | Meeting threshold lowered, naming no longer requiring evidence, **naming no longer requiring propriety**, evidence no longer capped, one-time options no longer hiding, options no longer granting evidence |
| Form of address and atmosphere | Replacement threshold zeroed, self-reference no longer highest priority, permeation no longer driving screen classes, no longer appending the "spoken for you" line |
| Author's-rights erosion | Wording switched to random, options no longer taken over, **swallowing words the player spoke**, replacement breaking HTML tags |
| Usurpation and the ledger | Threshold lowered to zero warnings, no longer reading the permeation level, proxy leaving no evidence, **the ledger itself eroded** |
| Interface and transgression | Wording change clearing click handlers, anchors failing early, failure becoming permanent contamination, transgression no longer having consequences (one each for answering outside and lifting the curtain) |
| Time and determinism | Monotonic advance changed to direct assignment, differential revisit text lost |
| Endings and saves | Terminal dispatch failing, no longer written to the ending record, illegal scene not returning to start, type checking reverted to `||`, unknown relics not removed, the start no longer refusing to overwrite, relics no longer granted |
| Post-review locks | Hidden-state delta accounting failing, the naming fallback removed, appended sentences reintroducing a bare "she", the edge before the courtyard stele removed |

Currently **39/39 precisely caught** (0 missed, 0 imprecise, 0 inapplicable). The script temporarily rewrites `js/core.js`, `js/chapter-v3.js`, and `js/items.js`; make sure the working tree has no unsaved important changes before running and do not run it in parallel with other edits or test processes. It restores from a snapshot at the end and verifies with a hash.

Mutation testing has exposed five kinds of "looks green but is actually empty" situations, all worth remembering:

- **Equivalent mutants**: after removing the write-side cap on `addEvidence` the suite stayed green, because the read-side `evidenceScore` clamped once more. Adding an assertion that inspects only the raw stored field closed it.
- **Anchors invalidated by their own edits**: after a wording fix, two mutants' `from` no longer existed and reported "inapplicable". That is not a pass — each anchor must be updated and the run repeated.
- **The criterion itself was wrong**: the static check "is a fallback left before an ending" originally looked only at direct out-edges, so the chain `naming → loss-question → ending` was treated as having a fallback (`loss-question` is a scene, not an ending). After switching to a fixed point over the transitive closure, the mutant that removes the naming fallback correctly went red in section 1.
- **Changing thin air**: the main menu title has a class but no id, so `applyMenuErosion` cannot reach the node and anchor failure **silently never happens** in production — while the test stub's `getElementById` conjures elements from nothing, so logic tests stay green. Section 18, "every id a script references must really exist in `index.html`", locks this down.
- **One gate masking another**: naming required both "evidence >= 1" and "propriety >= 2", but with zero evidence propriety is necessarily 0, so the mutant that removes the evidence requirement still stayed fully green. Adding "propriety full but evidence zero still does not open the gate" locked the two gates separately.

## Saves and data

The game saves to browser `localStorage`:

- `hongzhiyuan_save_v3` current progress (not written when starting from `arrival`, so existing progress is not overwritten)
- `hongzhiyuan_endings_v3` endings witnessed
- `hongzhiyuan_memory_v3` whether this story remembers you

Loading does full type normalization: a field that exists with the wrong type (a dirty save, a hand-edited save) is rebuilt, unknown relic ids are removed, and an illegal scene returns to the start. Clearing site data in the browser clears all of this too.

## Technical notes

- Plain HTML, CSS, and JavaScript, with no third-party runtime dependencies and no build tooling
- Classic `<script>` tags share one global lexical scope, with cross-file functions resolved at runtime
- Web Audio API generates interaction effects and atmosphere; at the permeation threshold it uses only a heartbeat rather than screen shake
- Zero-dependency testing: Node's built-in `vm` plus hand-written DOM / localStorage stubs drives the scene logic directly
- Script data is separated from the engine runtime
- Accessibility: custom `:focus-visible` focus ring, 44px touch targets on the top bar and relics, zoom allowed, `prefers-reduced-motion` disables flicker and falling motes (but keeps the permeation color shift — it is progress visibility, not decoration), and the typewriter uses `aria-busy` to keep screen readers from replaying character by character
- Sharing: `meta description` + the `og:` trio + an inline SVG favicon (still zero requests, zero dependencies)

## Scale

20 scenes, 47 options, 48 differential text segments, 3 endings, 5 relics; the body text with every variant included runs 2,890 characters, and 3,453 including the endings and relic text. A typical randomized playthrough takes 64 clicks and renders 3,504 characters — roughly 3 minutes with the typewriter, about 9 minutes read straight through. The three shortest routes to an ending are 7 / 11 / 12 clicks (settling respectively at the proxy signature, "Return to Her Registry", and "Loss of Name"), all arriving at ritual permeation 2.

## License

Released under the [MIT License](LICENSE), attributed below.

## Credits

试界 · TryWorld