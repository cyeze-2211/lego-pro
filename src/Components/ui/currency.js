import { parseNumber } from './number-format';

export const USD_RATE_KEY = 'payment_usd_rate';
export const CURRENCIES = ['UZS', 'USD'];

export const toMoney = (value) => {
    const n = Number(parseNumber(String(value ?? '')));
    return Number.isFinite(n) ? n : 0;
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const loadSavedRate = () => {
    try { return localStorage.getItem(USD_RATE_KEY) || ''; } catch { return ''; }
};

/** Bo‘sh qiymat (yangi yozuv uchun) */
export const emptyCurrencyValue = () => ({ currency: 'UZS', amount: '', usdAmount: '', usdRate: loadSavedRate() });

/** Mavjud yozuvdan (tahrirlash) — amount so‘mda, usdRate kurs */
export const currencyValueFrom = (entity, format) => {
    const currency = entity?.currency === 'USD' ? 'USD' : 'UZS';
    const amount = Number(entity?.amount) || 0;
    const rate = Number(entity?.usdRate) || 0;
    const fmt = (n) => (n > 0 ? (format ? format(String(round2(n))) ?? String(round2(n)) : String(round2(n))) : '');
    return {
        currency,
        amount: fmt(amount),
        usdAmount: currency === 'USD' && rate > 0 ? fmt(amount / rate) : '',
        usdRate: currency === 'USD' && rate > 0 ? fmt(rate) : loadSavedRate(),
    };
};

/** So‘mdagi yakuniy summa */
export const currencyUzsAmount = (value) => {
    if (value.currency === 'USD') return round2(toMoney(value.usdAmount) * toMoney(value.usdRate));
    return round2(toMoney(value.amount));
};

/** Backendga yuboriladigan qism: { amount, currency, usdRate? } */
export const buildCurrencyPayload = (value) => {
    const amount = currencyUzsAmount(value);
    if (value.currency === 'USD') return { amount, currency: 'USD', usdRate: round2(toMoney(value.usdRate)) };
    return { amount, currency: 'UZS' };
};

/** Tekshiruv: xato matni yoki null */
export const validateCurrencyValue = (value) => {
    if (value.currency === 'USD') {
        if (!(toMoney(value.usdAmount) > 0)) return 'Dollar summasi 0 dan katta bo‘lishi kerak';
        if (!(toMoney(value.usdRate) > 0)) return 'Dollar kursini kiriting (1 USD necha so‘m)';
    } else if (!(toMoney(value.amount) > 0)) {
        return 'Summa 0 dan katta bo‘lishi kerak';
    }
    const amount = currencyUzsAmount(value);
    if (!/^\d+(?:\.\d{1,2})?$/.test(String(amount))) return 'Summa 2 kasr xonagacha bo‘lishi kerak';
    return null;
};
