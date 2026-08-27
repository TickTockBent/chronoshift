// chronotime — pure metric-time math for the chronoshift panel.
// No Arduino, no hardware, no globals: everything here runs on the host
// under test/native. Inputs are a broken-down local time (struct tm as
// produced by localtime_r), so DST and timezone are already the libc's
// solved problem by the time values arrive here.

#ifndef CHRONOTIME_H
#define CHRONOTIME_H

#include <time.h>
#include <stddef.h>

namespace chronotime {

constexpr double KS_PER_DAY = 86.4;
constexpr double MS_PER_YEAR_COMMON = 31.536;  // 365 * 86400 / 1e6
constexpr double MS_PER_YEAR_LEAP = 31.6224;   // 366 * 86400 / 1e6

struct DayClock {
  double ks;        // wall-clock kiloseconds since local midnight, [0, 86.4)
  double fraction;  // ks / 86.4, [0, 1)
  int dayOfYear;    // 1-based, matches "Day N of YYYY"
  int year;
};

struct YearClock {
  double ms;        // megaseconds since local Jan 1 00:00, [0, msTotal)
  double msTotal;   // 31.536 or 31.6224
  double fraction;  // ms / msTotal, [0, 1)
  int year;
};

bool isLeapYear(int year);

DayClock dayClock(const struct tm& local);
YearClock yearClock(const struct tm& local);

// Formatting: fixed decimals, snprintf-safe. Buffers should be >= 12 bytes.
// dayValue  -> "53.436"        yearValue -> "20.598"
// dayLabel  -> "Day 239 of 2026" (buffer >= 20)
void formatDayValue(const DayClock& c, char* buf, size_t len);
void formatYearValue(const YearClock& c, char* buf, size_t len);
void formatDayLabel(const DayClock& c, char* buf, size_t len);

}  // namespace chronotime

#endif
