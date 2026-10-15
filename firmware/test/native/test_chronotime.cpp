// Host-run tests for lib/chronotime. Build & run: make test (in this dir).
// Plain asserts, no framework — the harness a wall clock deserves, no more.

#include <assert.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

#include "../../lib/chronotime/chronotime.h"

using namespace chronotime;

static int checks = 0;
#define CHECK(cond)                                          \
  do {                                                       \
    if (!(cond)) {                                           \
      fprintf(stderr, "FAIL %s:%d: %s\n", __FILE__, __LINE__, #cond); \
      return 1;                                              \
    }                                                        \
    ++checks;                                                \
  } while (0)

static bool near(double a, double b, double eps = 1e-9) {
  return fabs(a - b) < eps;
}

// Build a struct tm for local wall-clock components. Only the fields
// chronotime reads are set; tm_yday is supplied explicitly (0-based).
static struct tm at(int year, int yday0, int h, int m, int s) {
  struct tm t = {};
  t.tm_year = year - 1900;
  t.tm_yday = yday0;
  t.tm_hour = h;
  t.tm_min = m;
  t.tm_sec = s;
  return t;
}

int main() {
  // --- leap years: the full Gregorian rule ---
  CHECK(isLeapYear(2024));
  CHECK(!isLeapYear(2026));
  CHECK(!isLeapYear(1900));   // div 100 -> not leap
  CHECK(isLeapYear(2000));    // div 400 -> leap
  CHECK(isLeapYear(2400));
  CHECK(!isLeapYear(2100));

  // --- day clock: known wall-clock instants ---
  {
    DayClock c = dayClock(at(2026, 238, 0, 0, 0));  // local midnight
    CHECK(near(c.ks, 0.0));
    CHECK(near(c.fraction, 0.0));
    CHECK(c.dayOfYear == 239);
    CHECK(c.year == 2026);
  }
  {
    DayClock c = dayClock(at(2026, 238, 12, 0, 0));  // local noon
    CHECK(near(c.ks, 43.2));
    CHECK(near(c.fraction, 0.5));
  }
  {
    DayClock c = dayClock(at(2026, 238, 23, 59, 59));  // last second
    CHECK(near(c.ks, 86.399));
    CHECK(c.fraction < 1.0);
  }
  {
    DayClock c = dayClock(at(2026, 238, 14, 50, 36));  // 53.436 ks — today
    CHECK(near(c.ks, 53.436));
  }

  // --- year clock: boundaries and lengths ---
  {
    YearClock c = yearClock(at(2026, 0, 0, 0, 0));  // Jan 1 00:00
    CHECK(near(c.ms, 0.0));
    CHECK(near(c.msTotal, MS_PER_YEAR_COMMON));
    CHECK(near(c.fraction, 0.0));
  }
  {
    // Dec 31, 23:59:59 of a common year: yday0 = 364
    YearClock c = yearClock(at(2026, 364, 23, 59, 59));
    CHECK(near(c.ms, (365L * 86400L - 1) / 1e6));
    CHECK(c.fraction < 1.0);
    CHECK(c.fraction > 0.9999);
  }
  {
    // Leap year uses the longer total: Dec 31 of 2024 is yday0 = 365
    YearClock c = yearClock(at(2024, 365, 23, 59, 59));
    CHECK(near(c.msTotal, MS_PER_YEAR_LEAP));
    CHECK(c.fraction < 1.0);
  }
  {
    // Chronoshift's own birthday: New Year's Eve 2025, 13:24 local-ish.
    YearClock c = yearClock(at(2025, 364, 13, 24, 23));
    CHECK(near(c.ms, (364L * 86400L + 13 * 3600L + 24 * 60L + 23) / 1e6));
    CHECK(near(c.msTotal, MS_PER_YEAR_COMMON));
  }

  // --- formatting ---
  {
    char buf[20];
    DayClock c = dayClock(at(2026, 238, 14, 50, 36));
    formatDayValue(c, buf, sizeof buf);
    CHECK(strcmp(buf, "53.436") == 0);
    formatDayLabel(c, buf, sizeof buf);
    CHECK(strcmp(buf, "Day 239 of 2026") == 0);
  }
  {
    char buf[20];
    // 86399 s formats as 86.399 — never rounds up into a phantom 86.400+
    DayClock c = dayClock(at(2026, 238, 23, 59, 59));
    formatDayValue(c, buf, sizeof buf);
    CHECK(strcmp(buf, "86.399") == 0);
  }
  {
    char buf[20];
    YearClock c = yearClock(at(2026, 238, 14, 50, 36));
    formatYearValue(c, buf, sizeof buf);
    // 238*86400 + 53436 = 20616636 s -> 20.617 Ms
    CHECK(strcmp(buf, "20.617") == 0);
  }

  printf("chronotime: all %d checks passed\n", checks);
  return 0;
}
