import PropTypes from 'prop-types';

/*
 * EAN-13 shtrix-kod — tashqi kutubxonasiz SVG.
 * 13 raqam: 1-raqam juftlik naqshini beradi, 2–7 chap (L/G), 8–13 o‘ng (R) kodlanadi.
 * Jami 95 modul: 101 + 42 + 01010 + 42 + 101.
 */
const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

export const isEan13 = (value) => /^\d{13}$/.test(String(value ?? '').trim());

/** 95 ta '0'/'1' modul ketma-ketligi; noto‘g‘ri kod bo‘lsa null */
export function encodeEan13(value) {
    const code = String(value ?? '').trim();
    if (!isEan13(code)) return null;
    const digits = code.split('').map(Number);
    const parity = PARITY[digits[0]];
    let bits = '101';
    for (let i = 1; i <= 6; i += 1) bits += (parity[i - 1] === 'L' ? L : G)[digits[i]];
    bits += '01010';
    for (let i = 7; i <= 12; i += 1) bits += R[digits[i]];
    bits += '101';
    return bits;
}

/** SVG shtrix-kod. `height` — chiziqlar balandligi (px), `module` — bitta modul eni (px). */
export default function Barcode({ value, height = 70, module = 2, showText = true, color = '#000', background = '#fff', className }) {
    const bits = encodeEan13(value);
    const text = String(value ?? '').trim();
    if (!bits) {
        return (
            <div className={className} style={{ fontFamily: 'monospace', fontSize: 14, textAlign: 'center', color }}>
                {text || '—'}
            </div>
        );
    }
    const quiet = 9 * module;            // chetlardagi bo‘sh joy (skaner uchun)
    const textH = showText ? 16 : 0;
    const width = 95 * module + quiet * 2;
    const guard = new Set([0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94]); // qo‘riqchi chiziqlar — uzunroq
    const rects = [];
    for (let i = 0; i < bits.length; i += 1) {
        if (bits[i] !== '1') continue;
        const h = guard.has(i) ? height + 6 : height;
        rects.push(<rect key={i} x={quiet + i * module} y={0} width={module} height={h} fill={color} />);
    }
    const leftText = text.slice(1, 7);
    const rightText = text.slice(7);
    return (
        <svg
            className={className}
            viewBox={`0 0 ${width} ${height + 6 + textH}`}
            width={width}
            height={height + 6 + textH}
            role="img"
            aria-label={`Shtrix-kod ${text}`}
            style={{ background, maxWidth: '100%', height: 'auto' }}
        >
            {rects}
            {showText && (
                <g fontFamily="monospace" fontSize={12} fill={color}>
                    <text x={quiet - 4} y={height + 16} textAnchor="end">{text[0]}</text>
                    <text x={quiet + (3 + 21) * module} y={height + 16} textAnchor="middle">{leftText}</text>
                    <text x={quiet + (50 + 21) * module} y={height + 16} textAnchor="middle">{rightText}</text>
                </g>
            )}
        </svg>
    );
}

Barcode.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    height: PropTypes.number,
    module: PropTypes.number,
    showText: PropTypes.bool,
    color: PropTypes.string,
    background: PropTypes.string,
    className: PropTypes.string,
};
