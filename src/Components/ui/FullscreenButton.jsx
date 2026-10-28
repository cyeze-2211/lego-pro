import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Maximize, Minimize } from 'lucide-react';

/* ── Brauzerlar o‘rtasidagi farqlar (Safari webkit prefiks) ── */
const getFullscreenElement = () => document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
const isSupported = () => Boolean(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);

export async function toggleFullscreen() {
    try {
        if (getFullscreenElement()) {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } else {
            const el = document.documentElement;
            if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        }
    } catch {
        /* foydalanuvchi ruxsat bermadi yoki brauzer qo‘llamaydi — jim o‘tamiz */
    }
}

/** Hozir to‘liq ekran rejimidami — brauzer hodisasi orqali kuzatiladi (Esc bilan chiqilsa ham yangilanadi) */
export function useIsFullscreen() {
    const [active, setActive] = useState(() => Boolean(getFullscreenElement()));
    useEffect(() => {
        const sync = () => setActive(Boolean(getFullscreenElement()));
        document.addEventListener('fullscreenchange', sync);
        document.addEventListener('webkitfullscreenchange', sync);
        return () => {
            document.removeEventListener('fullscreenchange', sync);
            document.removeEventListener('webkitfullscreenchange', sync);
        };
    }, []);
    return active;
}

/**
 * Sarlavhadagi «To‘liq ekran» tugmasi — barcha rollar uchun bitta.
 * `className` — mavzu tugmasi bilan bir xil ko‘rinish uchun tashqaridan beriladi.
 */
export default function FullscreenButton({ className = '', iconClassName = 'h-4 w-4', size, lockKeyboard = false }) {
    const active = useIsFullscreen();
    /* Kiosk rejimi: to‘liq ekranda Esc tugmasi qulflanadi — tasodifan chiqib ketilmaydi (Chrome/Edge; boshqalarida jim o‘tadi) */
    useEffect(() => {
        if (!lockKeyboard) return undefined;
        const kb = navigator.keyboard;
        if (!kb?.lock) return undefined;
        if (active) kb.lock(['Escape']).catch(() => {});
        else kb.unlock?.();
        return () => { kb.unlock?.(); };
    }, [active, lockKeyboard]);
    const onClick = useCallback(() => { toggleFullscreen(); }, []);
    if (!isSupported()) return null; // masalan, iPhone Safari — tugmani ko‘rsatmaymiz
    const Icon = active ? Minimize : Maximize;
    return (
        <button
            type="button"
            onClick={onClick}
            className={className}
            title={active ? 'To‘liq ekrandan chiqish (Esc)' : 'To‘liq ekran'}
            aria-label={active ? 'To‘liq ekrandan chiqish' : 'To‘liq ekran'}
            aria-pressed={active}
        >
            <Icon className={iconClassName} size={size} />
        </button>
    );
}

FullscreenButton.propTypes = {
    className: PropTypes.string,
    iconClassName: PropTypes.string,
    size: PropTypes.number,
    lockKeyboard: PropTypes.bool,
};
