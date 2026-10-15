#include "chronotime.h"

#include <stdio.h>

namespace chronotime {

bool isLeapYear(int year) {
  if (year % 400 == 0) return true;
  if (year % 100 == 0) return false;
  return year % 4 == 0;
}

DayClock dayClock(const struct tm& local) {
  const int secIntoDay =
      local.tm_hour * 3600 + local.tm_min * 60 + local.tm_sec;
  DayClock c;
  c.ks = secIntoDay / 1000.0;
  c.fraction = secIntoDay / 86400.0;
  c.dayOfYear = local.tm_yday + 1;  // tm_yday is 0-based
  c.year = local.tm_year + 1900;
  return c;
}

YearClock yearClock(const struct tm& local) {
  const long secIntoDay =
      local.tm_hour * 3600L + local.tm_min * 60L + local.tm_sec;
  const long secIntoYear = local.tm_yday * 86400L + secIntoDay;
  YearClock c;
  c.year = local.tm_year + 1900;
  c.ms = secIntoYear / 1e6;
  c.msTotal = isLeapYear(c.year) ? MS_PER_YEAR_LEAP : MS_PER_YEAR_COMMON;
  c.fraction = c.ms / c.msTotal;
  return c;
}

void formatDayValue(const DayClock& c, char* buf, size_t len) {
  snprintf(buf, len, "%.3f", c.ks);
}

void formatYearValue(const YearClock& c, char* buf, size_t len) {
  snprintf(buf, len, "%.3f", c.ms);
}

void formatDayLabel(const DayClock& c, char* buf, size_t len) {
  snprintf(buf, len, "Day %d of %d", c.dayOfYear, c.year);
}

}  // namespace chronotime
