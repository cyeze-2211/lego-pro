/*
 * Zayavka qatorlari: yangi API da har bir qator `packQuantity` + `pieceQuantity` (va jami `quantity` dona).
 * Eski ma'lumotlar uchun (`unit` + `enteredQuantity`) moslik saqlanadi.
 */

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

/** Qatorni { packs, pieces, total, piecesPerPack } ko‘rinishiga keltiradi */
export function splitOrderItem(item) {
    const total = num(item?.quantity);
    if (item?.packQuantity != null || item?.pieceQuantity != null) {
        const packs = Math.max(0, Math.trunc(num(item.packQuantity)));
        const pieces = Math.max(0, Math.trunc(num(item.pieceQuantity)));
        const piecesPerPack = num(item.productPiecesPerPack ?? item.piecesPerPack) || (packs > 0 ? Math.max(0, Math.round((total - pieces) / packs)) : 0);
        return { packs, pieces, total: total || packs * piecesPerPack + pieces, piecesPerPack };
    }
    // Eski format: unit + enteredQuantity
    const unit = String(item?.unit ?? 'PIECE').toUpperCase();
    const entered = num(item?.enteredQuantity);
    if (unit === 'PACK' && entered > 0) {
        const piecesPerPack = num(item.productPiecesPerPack ?? item.piecesPerPack) || Math.round(total / entered);
        return { packs: entered, pieces: 0, total, piecesPerPack };
    }
    return { packs: 0, pieces: total, total, piecesPerPack: num(item?.productPiecesPerPack ?? item?.piecesPerPack) };
}

/** «5 pachka + 2 dona» ko‘rinishidagi matn */
export function formatPackPiece({ packs, pieces }, { short = false } = {}) {
    const parts = [];
    if (packs > 0) parts.push(`${packs} ${short ? 'p.' : 'pachka'}`);
    if (pieces > 0 || parts.length === 0) parts.push(`${pieces} ${short ? 'd.' : 'dona'}`);
    return parts.join(' + ');
}

/** Ombor harakati uchun bitta qator: pachka va dona birga bo‘lsa — donaga o‘girib yuboriladi */
export function toStockItem(productId, packs, pieces, piecesPerPack) {
    const p = Math.max(0, Math.trunc(num(packs)));
    const d = Math.max(0, Math.trunc(num(pieces)));
    const ppp = Math.max(0, Math.trunc(num(piecesPerPack)));
    if (p > 0 && d === 0) return { productId, quantity: p, unit: 'PACK' };
    if (p === 0) return { productId, quantity: d, unit: 'PIECE' };
    return { productId, quantity: p * ppp + d, unit: 'PIECE' };
}
