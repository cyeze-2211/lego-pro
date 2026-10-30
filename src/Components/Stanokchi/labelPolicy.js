import { productApi } from '../../store/services/product.api';

/*
 * VAQTINCHALIK: true — stanokda «+1» bosilganda oyna ochiladi (nechta pachka, nechta yorliq, qaysi printer).
 * false — eski rejim: bosish = darhol 1 pachka + 2 yorliq. Qaytarish uchun shu qiymatni o‘zgartiring.
 */
export const PRODUCE_WITH_DIALOG = true;

/*
 * Yorliq (shtrix-kod) faqat tayyor mahsulot (type = FINISHED) uchun chop etiladi.
 * Yarim tayyor (SEMI_FINISHED) — yorliqsiz. Ishlab chiqarish seansida mahsulot turi kelmaydi,
 * shuning uchun bosishda mahsulotni keshdan/serverdan o‘qiymiz (RTK Query keshi qayta ishlatiladi).
 */
export async function shouldPrintLabel(dispatch, productId) {
    if (!productId) return false;
    try {
        const product = await dispatch(productApi.endpoints.getProductById.initiate(productId, { subscribe: false })).unwrap();
        return (product?.type || 'FINISHED') === 'FINISHED';
    } catch {
        // Mahsulot o‘qilmasa — avvalgidek chop etamiz (tayyor mahsulot deb hisoblaymiz)
        return true;
    }
}
