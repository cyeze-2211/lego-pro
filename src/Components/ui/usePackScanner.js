import { useCallback, useEffect, useRef, useState } from 'react';
import { useLazyGetPackByBarcodeQuery } from '../../store/services/productPack.api';

/*
 * Pachka skaneri (pistolet). Skaner klaviatura kabi tez teradi va Enter yuboradi — fokus boshqa joyda
 * bo‘lsa ham ushlaymiz (global keydown bufer, ≥ 6 belgi, 400 ms ichida). Kod GET /product-packs/by-barcode/{barcode}
 * bilan pachkaga aylantiriladi va `onPack(pack, code)` ga beriladi; topilmasa `onError(text, code)`.
 *
 * Qaytaradi: { value, setValue, inputRef, inputProps, submit(code), busy, beep }.
 * inputProps ni skaner maydoniga tarqating (<input {...inputProps} />): Enter → submit.
 */
export const PACK_BARCODE_RE = /^\d{8,14}$/;

export function beep(ok = true) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.frequency.value = ok ? 1200 : 300; gain.gain.value = 0.05;
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + (ok ? 0.08 : 0.25));
        setTimeout(() => ctx.close(), 400);
    } catch { /* ovoz yo‘q */ }
}

export function packErrorText(err, code) {
    if (err?.status === 404 || err?.response?.status === 404) return `Bunday barcode‘li pachka yo‘q: ${code}`;
    return err?.data?.message || err?.response?.data?.message || `Barcode o‘qilmadi: ${code}`;
}

export default function usePackScanner({ enabled = true, onPack, onError } = {}) {
    const [value, setValue] = useState('');
    const [busy, setBusy] = useState(false);
    const inputRef = useRef(null);
    const bufferRef = useRef({ text: '', at: 0 });
    const [fetchPack] = useLazyGetPackByBarcodeQuery();
    const onPackRef = useRef(onPack); onPackRef.current = onPack;
    const onErrorRef = useRef(onError); onErrorRef.current = onError;

    const submit = useCallback(async (raw) => {
        const code = String(raw ?? '').trim();
        setValue('');
        if (!code) return;
        setBusy(true);
        try {
            const pack = await fetchPack(code).unwrap();
            if (!pack?.id) throw new Error('empty');
            await onPackRef.current?.(pack, code);
        } catch (err) {
            beep(false);
            onErrorRef.current?.(packErrorText(err, code), code);
        } finally {
            setBusy(false);
        }
    }, [fetchPack]);

    /* Global bufer: fokus boshqa joyda bo‘lsa ham pistolet ishlaydi */
    useEffect(() => {
        if (!enabled) return undefined;
        const onKey = (e) => {
            const tag = e.target?.tagName;
            const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
            if (e.target === inputRef.current) return; // skaner maydoni o‘zi onKeyDown bilan ishlaydi
            if (inField) return; // boshqa maydonda yozilmoqda
            const buf = bufferRef.current;
            const now = Date.now();
            if (now - buf.at > 400) buf.text = ''; // sekin terilgan — skaner emas
            buf.at = now;
            if (e.key === 'Enter') {
                if (buf.text.length >= 6) { e.preventDefault(); submit(buf.text); }
                buf.text = '';
            } else if (e.key.length === 1) {
                buf.text += e.key;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [enabled, submit]);

    const inputProps = {
        ref: inputRef,
        value,
        type: 'text',
        inputMode: 'numeric',
        autoComplete: 'off',
        onChange: (e) => setValue(e.target.value),
        onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(value); } },
    };

    return { value, setValue, inputRef, inputProps, submit, busy };
}
