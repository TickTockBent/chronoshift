// chronoshift panel — kilosecond day clock / megasecond year clock on e-ink.
// Everything assertable lives in lib/chronotime; this file only wires the
// hardware to it. See SPEC.md for the reasoning behind every number here.

#include <Arduino.h>
#include <Preferences.h>
#include <WiFi.h>
#include <esp_sntp.h>

#include <GxEPD2_BW.h>
#include <Fonts/FreeMonoBold9pt7b.h>
#include <Fonts/FreeMonoBold24pt7b.h>

#include "chronotime.h"
#include "secrets.h"  // copy include/secrets.h.example -> include/secrets.h

// ---- Hardware: LilyGO T5 2.13" V2.3.1 (DEPG0213BN). For other panels,
// change the driver class and this pin block only.
#define EPD_CS 5
#define EPD_DC 17
#define EPD_RST 16
#define EPD_BUSY 4
#define BUTTON_PIN 39  // T5 side button, input-only pin, external pull-up

static GxEPD2_BW<GxEPD2_213_BN, GxEPD2_213_BN::HEIGHT> display(
    GxEPD2_213_BN(EPD_CS, EPD_DC, EPD_RST, EPD_BUSY));

// ---- Cadence (SPEC.md "Refresh strategy") ----
static const uint32_t TICK_MS = 10000;      // partial refresh: 0.01 ks
static const uint16_t FULL_EVERY = 100;     // full refresh once per kilosecond
static const time_t SYNC_STALE_S = 86400;   // hollow dot after 24 h unsynced

enum Mode : uint8_t { DAY_KS = 0, YEAR_MS = 1 };

static Preferences prefs;
static Mode mode = DAY_KS;
static uint16_t ticksSinceFull = 0;
static volatile time_t lastSyncAt = 0;
static uint32_t lastTickAt = 0;

static void onTimeSync(struct timeval*) { lastSyncAt = time(nullptr); }

static bool timeIsValid() {
  return time(nullptr) > 1600000000;  // any post-2020 epoch means NTP landed
}

static void drawFrame(bool full) {
  struct tm local;
  time_t now = time(nullptr);
  localtime_r(&now, &local);

  char value[16] = "--.---";
  char label[24] = "waiting for time";
  const char* suffix = (mode == DAY_KS) ? " ks" : " Ms";
  float fraction = 0.0f;

  if (timeIsValid()) {
    if (mode == DAY_KS) {
      chronotime::DayClock c = chronotime::dayClock(local);
      chronotime::formatDayValue(c, value, sizeof value);
      chronotime::formatDayLabel(c, label, sizeof label);
      fraction = (float)c.fraction;
    } else {
      chronotime::YearClock c = chronotime::yearClock(local);
      chronotime::formatYearValue(c, value, sizeof value);
      snprintf(label, sizeof label, "%d", c.year);
      fraction = (float)c.fraction;
    }
  }

  const int W = display.width();   // 250 in landscape
  const int H = display.height();  // 122

  auto render = [&]() {
    display.fillScreen(GxEPD_WHITE);

    // Big value, centered-ish
    display.setFont(&FreeMonoBold24pt7b);
    display.setTextColor(GxEPD_BLACK);
    display.setCursor(8, 52);
    display.print(value);
    display.setFont(&FreeMonoBold9pt7b);
    display.print(suffix);

    // Progress bar
    const int barX = 8, barY = 70, barW = W - 16, barH = 18;
    display.drawRect(barX, barY, barW, barH, GxEPD_BLACK);
    int fill = (int)((barW - 4) * fraction);
    if (fill > 0) display.fillRect(barX + 2, barY + 2, fill, barH - 4, GxEPD_BLACK);

    // Sublabel + sync indicator
    display.setFont(&FreeMonoBold9pt7b);
    display.setCursor(8, H - 8);
    display.print(label);
    bool stale = !timeIsValid() ||
                 (lastSyncAt > 0 && time(nullptr) - lastSyncAt > SYNC_STALE_S);
    if (stale) display.drawCircle(W - 12, H - 12, 4, GxEPD_BLACK);  // hollow dot
  };

  if (full) {
    display.setFullWindow();
    display.firstPage();
    do { render(); } while (display.nextPage());
    ticksSinceFull = 0;
  } else {
    display.setPartialWindow(0, 0, W, H);
    display.firstPage();
    do { render(); } while (display.nextPage());
    ++ticksSinceFull;
  }
}

static void toggleMode() {
  mode = (mode == DAY_KS) ? YEAR_MS : DAY_KS;
  prefs.putUChar("mode", (uint8_t)mode);
  drawFrame(true);  // mode switches earn a clean slate
}

static void pollButton() {
  static bool wasDown = false;
  static uint32_t downAt = 0;
  bool down = digitalRead(BUTTON_PIN) == LOW;
  uint32_t ms = millis();
  if (down && !wasDown) downAt = ms;
  if (!down && wasDown && ms - downAt > 50) toggleMode();  // debounced release
  wasDown = down;
}

void setup() {
  pinMode(BUTTON_PIN, INPUT);
  prefs.begin("chronoshift");
  mode = (Mode)prefs.getUChar("mode", DAY_KS);

  display.init(0, true, 2, false);
  display.setRotation(1);  // landscape

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  sntp_set_time_sync_notification_cb(onTimeSync);
  configTzTime(TZ_STRING, "pool.ntp.org", "time.cloudflare.com");

  drawFrame(true);  // shows --.--- until NTP lands; honesty over guessing
}

void loop() {
  pollButton();
  uint32_t ms = millis();
  if (ms - lastTickAt >= TICK_MS) {
    lastTickAt = ms;
    drawFrame(ticksSinceFull >= FULL_EVERY - 1);
  }
  delay(10);
}
