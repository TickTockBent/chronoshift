# Chronoshift Panel — firmware spec

A physical kilosecond clock for a cubicle wall: an e-ink day-progress display in
metric time, with a megasecond year clock one button-press away. Companion
hardware for the chronoshift web app; mirrors its `kiloseconds` system's
semantics exactly.

## Hardware

**Primary target: LilyGO T5 2.13" (V2.3.1, DEPG0213BN panel).** One board:
ESP32, e-ink, USB, and a usable side button, ~$20. No soldering.

**Alternate:** any ESP32 dev board + WeAct/Waveshare 2.9" SSD1680 e-ink over
SPI. Pin mapping lives in one `#define` block in `main.cpp`; the GxEPD2 driver
class is the only other thing that changes.

Power: USB. E-ink holds its image unpowered, but the clock ticks, so it stays
plugged in. Battery operation is out of scope (a wall clock has a wall).

## Modes

| Mode | Value | Bar | Sublabel | Value changes every |
|---|---|---|---|---|
| `DAY_KS` | `53.436 ks` | day fraction (x/86.4) | `Day 239 of 2026` | 10 s (0.01 ks) |
| `YEAR_MS` | `20.598 Ms` | year fraction (x/31.536 or 31.6224) | `2026` | 1000 s (0.001 Ms = 1 ks) |

Short-press the button to toggle modes. The chosen mode persists in NVS across
power loss.

The megasecond display keeps three decimals deliberately: its last digit is one
kilosecond, so the year clock visibly ticks every 16 min 40 s — a natural
e-ink cadence, and the two modes stay in the same unit family (the year is
simply ~365.25 day-bars laid end to end).

## Display semantics (matches `src/systems/kiloseconds.ts`)

- **Wall-clock seconds, local time.** 13:00 local is always 46.8 ks, DST or
  not. On DST transition days the bar's *rate* is honest and its span is not
  (a 23-hour day still renders against 86.4) — same behavior as the web app,
  accepted, documented here so nobody "fixes" it.
- Timezone comes from a POSIX TZ string in `secrets.h`
  (e.g. `EST5EDT,M3.2.0,M11.1.0`) via `configTzTime()`. DST is the libc's
  problem, which is the only acceptable number of times to solve DST (zero).
- Year length for `YEAR_MS`: 31.536 Ms (365 d) or 31.6224 Ms (leap). Leap rule
  is the full Gregorian one (div 4, except div 100, except div 400).

## Refresh strategy

- **Partial refresh every 10 s** — one tick of the last kilosecond digit pair.
- **Full refresh every 100 ticks** — i.e. exactly once per kilosecond — to
  clear e-ink ghosting. The display deep-cleans itself on the unit it displays.
- All rendering is stateless: every tick recomputes from `time(nullptr)`.
  Midnight and New Year need no rollover logic because nothing carries over.

## Time sync

- NTP via `configTzTime()` (pool.ntp.org + time.cloudflare.com); the ESP32 SNTP
  client re-syncs itself periodically (default ~1 h).
- A sync callback stamps `lastSyncAt`. If >24 h since last sync, a small hollow
  dot renders in the footer — the clock is coasting on the crystal (worst case
  drift ~a few seconds/day, invisible at 0.01 ks resolution for weeks).
- Never synced (no WiFi at boot): the display shows `--.---` and the bar stays
  empty. A clock guessing is worse than a clock admitting it. It keeps
  retrying; WiFi loss after a good sync just means coasting, not blanking.

## Controls

One button (GPIO 39 on the T5, `BUTTON_PIN` otherwise), polled with 50 ms
debounce. Short press: toggle mode, immediate full refresh. That's the whole
interface. Anything needing two buttons belongs in the web app.

## Code layout

```
firmware/
  SPEC.md            — this file
  README.md          — build + flash instructions
  platformio.ini     — env:t5 (primary), env:esp32-generic (alternate)
  include/secrets.h.example  — WiFi creds + TZ string (copy to secrets.h, gitignored)
  lib/chronotime/    — pure time math, no Arduino includes, host-testable
  src/main.cpp       — WiFi, NTP, display, button, tick loop
  test/native/       — host-run unit tests for lib/chronotime (make test)
```

`lib/chronotime` is the harness boundary: everything assertable (kiloseconds,
megaseconds, leap years, day-of-year, fractions, formatting) is pure C++ tested
on the host with `make test` — no board, no toolchain beyond g++. `main.cpp`
only wires hardware to those functions and is kept too thin to hide bugs in.

## Out of scope (deliberately)

Battery + deep sleep, web config portal, OTA updates, multiple displays,
additional time systems. The web app is the place for breadth; the panel does
two numbers well.
