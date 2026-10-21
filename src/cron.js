/**
 * Cron Expression Parser & Next Run Calculator
 * Pure JS implementation with timezone support (default UTC+8 / Asia/Shanghai)
 */

function parseField(field, min, max) {
  const values = new Set();
  const parts = field.split(',');

  for (const part of parts) {
    if (part === '*') {
      for (let i = min; i <= max; i++) values.add(i);
    } else if (part.includes('/')) {
      const [range, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) continue;

      let start = min;
      let end = max;
      if (range !== '*') {
        if (range.includes('-')) {
          const [s, e] = range.split('-').map(Number);
          start = s;
          end = e;
        } else {
          start = parseInt(range, 10);
        }
      }
      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) values.add(i);
      }
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) values.add(i);
      }
    } else {
      const val = parseInt(part, 10);
      if (!isNaN(val) && val >= min && val <= max) {
        values.add(val);
      }
    }
  }

  return values;
}

/**
 * Parse a standard 5-part cron string
 * @param {string} cronString "min hour day month day-of-week"
 */
export function parseCron(cronString) {
  const parts = cronString.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron format: "${cronString}". Expected 5 parts: min hour day month dayOfWeek`);
  }

  const minutes = parseField(parts[0], 0, 59);
  const hours = parseField(parts[1], 0, 23);
  const days = parseField(parts[2], 1, 31);
  const months = parseField(parts[3], 1, 12);
  let daysOfWeek = parseField(parts[4], 0, 7);

  if (daysOfWeek.has(7)) {
    daysOfWeek.add(0);
  }

  return { minutes, hours, days, months, daysOfWeek, raw: cronString };
}

/**
 * Get next execution Date from a given timestamp
 * @param {string} cronString 
 * @param {Date|number} fromDate 
 * @param {number} tzOffsetHours Timezone offset in hours (default: 8 for Asia/Shanghai)
 * @returns {Date}
 */
export function getNextCronRun(cronString, fromDate = new Date(), tzOffsetHours = 8) {
  const parsed = parseCron(cronString);
  const fromMs = typeof fromDate === 'number' ? fromDate : fromDate.getTime();
  
  let currentMs = Math.floor(fromMs / 60000) * 60000 + 60000;
  const maxMs = currentMs + 366 * 24 * 60 * 60 * 1000;

  while (currentMs < maxMs) {
    const targetDate = new Date(currentMs + tzOffsetHours * 3600000);
    const minute = targetDate.getUTCMinutes();
    const hour = targetDate.getUTCHours();
    const day = targetDate.getUTCDate();
    const month = targetDate.getUTCMonth() + 1;
    const dayOfWeek = targetDate.getUTCDay();

    if (
      parsed.months.has(month) &&
      parsed.days.has(day) &&
      parsed.daysOfWeek.has(dayOfWeek) &&
      parsed.hours.has(hour) &&
      parsed.minutes.has(minute)
    ) {
      return new Date(currentMs);
    }

    currentMs += 60000;
  }

  throw new Error(`Could not find next execution time within 1 year for cron "${cronString}"`);
}

/**
 * Convert cron to friendly readable text (Chinese)
 */
export function describeCron(cronString) {
  try {
    const parts = cronString.trim().split(/\s+/);
    if (parts.length !== 5) return cronString;

    const [min, hour, dom, mon, dow] = parts;

    if (min === '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
      return '每分钟执行一次';
    }
    if (min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
      return `每 ${min.substring(2)} 分钟执行一次`;
    }
    if (min === '0' && hour.startsWith('*/') && dom === '*' && mon === '*' && dow === '*') {
      return `每 ${hour.substring(2)} 小时整点执行`;
    }
    if (dom === '*' && mon === '*' && dow === '*') {
      return `每天 ${hour.padStart(2, '0')}:${min.padStart(2, '0')} 执行`;
    }
    if (dow === '1-5' && dom === '*' && mon === '*') {
      return `工作日 (周一至周五) ${hour.padStart(2, '0')}:${min.padStart(2, '0')} 执行`;
    }
    return `Cron 规则: ${cronString}`;
  } catch {
    return cronString;
  }
}
