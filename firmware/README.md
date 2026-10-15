# chronoshift panel

The web app's `kiloseconds` system, made of matter: an e-ink day-progress
clock (`53.436 ks`, bar to 86.4) with a megasecond year clock one button-press
away (`20.617 Ms`, bar to 31.536). Design rationale in [SPEC.md](SPEC.md).

## Hardware

LilyGO T5 2.13" V2.3.1 (~$20, everything on one board). Other ESP32 + SPI
e-ink combos work — edit the pin block and GxEPD2 driver class at the top of
`src/main.cpp`.

## Build & flash

```bash
cp include/secrets.h.example include/secrets.h   # fill in WiFi + TZ
pio run -e t5 -t upload
```

## Test (no hardware needed)

All time math lives in `lib/chronotime` — pure C++, no Arduino:

```bash
cd test/native && make test
```

## Behavior at a glance

- Partial e-ink refresh every 10 s (0.01 ks); full refresh once per kilosecond.
- Button: toggle day/year mode; choice persists across power loss.
- Before first NTP sync it shows `--.---` — it will not guess.
- Hollow dot in the corner = no sync for >24 h (coasting on the crystal).
