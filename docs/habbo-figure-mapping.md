# Habbo figure IDs for pixel accessories (Aurora)

This document explains how we map **eyewear** (`ea`), **earrings** (`he`), and **necklaces** (`ca`) to Habbo’s imaging API, so **button labels and previews match the real asset**. Use it when you want to add or fix accessory options in the app.

---

## The two GitHub repos (and what they are for)

### 1. [flaviobdev/habbo-assets](https://github.com/flaviobdev/habbo-assets)

- **What it is:** a small **React icon** package (e.g. `VipIcon`), published as `habbo-assets` on npm.
- **What it is *not*:** it does **not** contain Habbo **figure set IDs**, `figuredata`, or `figuremap`. You **cannot** derive `ea-3493-61`-style IDs from this repo.
- **When to mention it:** only if you need UI icons from that package—not for validating avatar parts.

### 2. [open-hotel](https://github.com/open-hotel) (organisation)

- **What matters for Aurora:** the **[open-hotel-resources](https://github.com/open-hotel/open-hotel-resources)** repo.
- **Source of truth files** (on `master`, under `dist/`):
  - [`figuredata.json`](https://raw.githubusercontent.com/open-hotel/open-hotel-resources/master/dist/figuredata.json) — defines **set types** (`ea`, `he`, `ca`, …) and each **set id** with its **parts** (each part has an numeric `id` and `type`).
  - [`figuremap.json`](https://raw.githubusercontent.com/open-hotel/open-hotel-resources/master/dist/figuremap.json) — maps each part `id` (per type) to an index in `libs`, and each `libs[i].id` is the **asset name** (e.g. `acc_eye_U_bigshades`).

Production Habbo (`habbo.com`) may differ slightly from Open Hotel dumps over time, but this pipeline is how we **name and verify** items consistently before shipping UI labels.

---

## How the mapping works (short)

1. In **`figuredata.json`**, under `settype.<TYPE>.set`, pick a **set key** (string number), e.g. `"3493"` under `settype.ea.set`.
2. Read that set’s **`parts[0].id`** (the part id used for lookup).
3. In **`figuremap.json`**, open **`parts.<TYPE>`** and look up that part id as a string key, e.g. `parts.ea["1234"]` → library index `N`.
4. Resolve **`libs[N].id`** — that string is the **real asset** (e.g. `acc_chest_U_beads`).
5. The Habbo figure fragment is **`ea-<setId>-<paletteIndex>`** (and similarly `he-…`, `ca-…`). Aurora builds the full string in `frontend/src/utils/habboFigure.ts` and resolves set ids from **`frontend/src/constants/pixelCharacterOptions.ts`**.

If the label says “chain” but `libs[N].id` is `acc_chest_U_silkscarf`, the **set id is wrong or the label must change**.

---

## Pitfalls we hit (so you don’t repeat them)

- **Legacy human layers:** many low `ea` set ids (e.g. around `1401`–`1406`) map every part to **`hh_human_acc_eye`** — not themed sunglasses. Always check **`libs[].id`**, not only the set number.
- **Same number, different meaning:** palette indices in `habboFigure.ts` (e.g. for hex → Habbo colour id) are **not** the same thing as **figure set ids** in `pixelCharacterOptions.ts`.
- **`he` is not only “small earrings”:** wrong ids can point at **hats**, **ponytails**, **goggles**, etc. Always trace **`parts.he`** → **`libs`**.
- **`ca` is chest slot:** wrong ids can be **scarves**, **backpacks**, **bears**, etc. Trace **`parts.ca`** → **`libs`**.
- **Club / HC:** `figuredata` marks some sets as club-only (`club: "2"`). They may still render in **`habbo-imaging`** for previews; if an item never shows, try another set or verify on a live URL.

---

## Quick audit script (Node)

From a folder where you saved `figuredata.json` and `figuremap.json` (download the two raw files from open-hotel-resources):

```js
const fd = require('./figuredata.json');
const fm = require('./figuremap.json');

function resolve(settype, setId) {
  const s = fd.settype[settype].set[String(setId)];
  if (!s?.parts?.[0]) return null;
  const pid = String(s.parts[0].id);
  const li = fm.parts[settype][pid];
  return {
    setId,
    partId: pid,
    lib: fm.libs[li]?.id,
    club: s.club,
    colorable: s.colorable,
    parts: s.parts.length,
  };
}

// Examples:
console.log(resolve('ea', 3493));
console.log(resolve('he', 3070));
console.log(resolve('ca', 3343));
```

To **discover** candidates for a type, loop `Object.keys(fd.settype.ea.set)` (or `he` / `ca`), call `resolve`, and **filter** `lib` by prefix, e.g. `acc_eye_U_`, `acc_head_U_earring`, `acc_chest_U_beads`, etc.

---

## Where to edit in Aurora

| Role | File |
|------|------|
| Set ids + UI labels for accessories | `frontend/src/constants/pixelCharacterOptions.ts` (`EYEWEAR_STYLES`, `EARRING_STYLES`, `NECKLACE_STYLES`) |
| Figure string + imaging URL | `frontend/src/utils/habboFigure.ts` |
| Memo / image reload | `frontend/src/components/pixel/PixelCharacter.tsx` |

When adding options, prefer **keeping existing `value` strings** (`classicShades`, `chain`, …) if users already have them saved; update **`eaSet` / `heSet` / `caSet` and `label`** when fixing a mismatch.

---

## Live check (optional)

Full URL shape (see `buildHabboImageUrl` in `habboFigure.ts`):

`https://www.habbo.com/habbo-imaging/avatarimage?figure=<encoded figure>&direction=2&head_direction=2&size=l&action=std&gesture=std`

Paste a `figure` string that includes your new `ea-`, `he-`, or `ca-` fragment to confirm it draws as expected.

---

## Asking the AI to add more items later

You can say something like:

> “Add a new eyewear option using **open-hotel-resources** `figuredata` + `figuremap`: find an `ea` set whose first part resolves to `acc_eye_U_<name>`, club 0 if possible, add it to `EYEWEAR_STYLES` with a label that matches the asset, and follow `docs/habbo-figure-mapping.md`.”

Link this file and, if needed, the exact asset name or Habbo catalogue name you want matched.

---

## Examples added using this workflow (Aurora)

These rows were added by resolving **`figuredata` → `figuremap` → `libs[].id`** (see script above), then wiring **`eaSet` / `heSet` / `caSet`** in `pixelCharacterOptions.ts`. Labels match the asset, not a vague nickname.

| UI label | Saved `value` | Type | Set id | `libs[].id` (first part) | Notes |
|----------|---------------|------|--------|---------------------------|--------|
| Sunglasses | `sunglasses` | `ea` | `3169` | `acc_eye_U_sunglasses4` | Single-part classic Habbo shades (HC in figuredata). |
| Leaf earrings | `leafEarrings` | `he` | `3833` | `acc_head_U_leafearrings` | Club `0` in figuredata; distinct from ring/gem/star studs. |
| Strand necklace | `strandNecklace` | `ca` | `3177` | `acc_chest_U_strands` | Multi-strand chest piece; HC in figuredata. |

Run `resolve('ea', 3169)`, `resolve('he', 3833)`, `resolve('ca', 3177)` with the audit script to re-verify after updating open-hotel-resources.

---

## Reference links

- [flaviobdev/habbo-assets](https://github.com/flaviobdev/habbo-assets) — React icons (not figure IDs).
- [open-hotel organisation](https://github.com/open-hotel)
- [open-hotel/open-hotel-resources](https://github.com/open-hotel/open-hotel-resources)
- Raw [figuredata.json](https://raw.githubusercontent.com/open-hotel/open-hotel-resources/master/dist/figuredata.json)
- Raw [figuremap.json](https://raw.githubusercontent.com/open-hotel/open-hotel-resources/master/dist/figuremap.json)
