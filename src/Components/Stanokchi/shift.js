/* Smena hisob-kitobi va vaqt formatlash — stanokchi sahifalari uchun umumiy yordamchilar */

const UZBEKISTAN_TIME_ZONE = 'Asia/Tashkent';
const pad = (value) => String(value).padStart(2, '0');

export const getUzbekistanTimeParts = (date) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: UZBEKISTAN_TIME_ZONE,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    return Object.fromEntries(parts.map(({ type, value }) => [type, Number(value)]));
};

/** API uchun ISO-8601 (yyyy-MM-ddTHH:mm:ss) — Toshkent devor vaqti UTC maydonlarida saqlanadi */
export const formatApiDateTime = (date) =>
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;

/** Kunduzgi smena 08:00–20:00, kechki 20:00–08:00 (Toshkent vaqti) */
export const getCurrentShift = (now = new Date()) => {
    const { year, month, day, hour, minute, second } = getUzbekistanTimeParts(now);
    const wall = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const start = new Date(wall);
    const end = new Date(wall);

    if (hour >= 8 && hour < 20) {
        start.setUTCHours(8, 0, 0, 0);
        end.setUTCHours(20, 0, 0, 0);
        return { name: 'Kunduzgi smena', start, end };
    }
    if (hour >= 20) {
        start.setUTCHours(20, 0, 0, 0);
        end.setUTCDate(end.getUTCDate() + 1);
        end.setUTCHours(8, 0, 0, 0);
    } else {
        start.setUTCDate(start.getUTCDate() - 1);
        start.setUTCHours(20, 0, 0, 0);
        end.setUTCHours(8, 0, 0, 0);
    }
    return { name: 'Kechki smena', start, end };
};

export const formatShiftDateTime = (date) =>
    `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;

export const formatDurationMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours && minutes) return `${hours} soat ${minutes} daqiqa`;
    if (hours) return `${hours} soat`;
    return `${minutes} daqiqa`;
};

export const formatDurationSeconds = (seconds = 0) => formatDurationMinutes(Math.floor((Number(seconds) || 0) / 60));

export const calcDuration = (startedAt, endedAt) => {
    if (!startedAt) return null;
    const diffMs = (endedAt ? new Date(endedAt) : new Date()) - new Date(startedAt);
    if (Number.isNaN(diffMs) || diffMs < 0) return null;
    return formatDurationMinutes(Math.floor(diffMs / 60000));
};
